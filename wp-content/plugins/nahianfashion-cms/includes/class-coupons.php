<?php
defined('ABSPATH') || exit;

/**
 * Coupons are WooCommerce coupons (post type shop_coupon). Mapping from the original model:
 *   type percent|fixed -> discount_type percent|fixed_cart, value -> amount, min_order -> minimum_amount,
 *   max_uses -> usage_limit, used_count -> usage_count, expires_at -> date_expires, is_active -> post_status.
 * The discount itself is computed here (not by WooCommerce) with the original storefront rules.
 */
class NF_Coupons {
    public static function find(string $code): ?array {
        $code = strtoupper(trim($code));
        if ($code === '') {
            return null;
        }
        $posts = get_posts([
            'post_type' => 'shop_coupon', 'post_status' => ['publish', 'draft', 'private'], 'posts_per_page' => 1,
            'title' => $code, 'orderby' => 'ID',
        ]);
        if (!$posts || strtoupper($posts[0]->post_title) !== $code) {
            return null;
        }
        $id = $posts[0]->ID;
        $expires = get_post_meta($id, 'date_expires', true);
        return [
            'id'         => $id,
            'code'       => $code,
            'type'       => get_post_meta($id, 'discount_type', true) === 'percent' ? 'percent' : 'fixed',
            'value'      => (float) get_post_meta($id, 'coupon_amount', true),
            'min_order'  => (float) get_post_meta($id, 'minimum_amount', true),
            'max_uses'   => (int) get_post_meta($id, 'usage_limit', true),
            'used_count' => (int) get_post_meta($id, 'usage_count', true),
            'is_active'  => $posts[0]->post_status === 'publish',
            'expires_at' => $expires !== '' ? (int) $expires : null,
        ];
    }

    public static function discount_for(array $c, float $subtotal): float {
        $d = $c['type'] === 'percent'
            ? ($subtotal * min($c['value'], 100)) / 100
            : min($c['value'], $subtotal);
        return min($d, $subtotal);
    }

    /** @return array{ok:bool,status?:int,error?:string,coupon?:array,discount?:float} */
    public static function validate(string $code, float $subtotal): array {
        $c = self::find($code);
        if (!$c || !$c['is_active']) {
            return ['ok' => false, 'status' => 404, 'error' => 'Invalid or expired coupon code.'];
        }
        if ($c['expires_at'] && $c['expires_at'] <= time()) {
            return ['ok' => false, 'status' => 400, 'error' => 'This coupon has expired.'];
        }
        if ($c['max_uses'] && $c['used_count'] >= $c['max_uses']) {
            return ['ok' => false, 'status' => 400, 'error' => 'This coupon has reached its usage limit.'];
        }
        if ($c['min_order'] && $subtotal < $c['min_order']) {
            return ['ok' => false, 'status' => 400, 'error' => 'Minimum order of ৳' . number_format($c['min_order']) . ' required for this coupon.'];
        }
        return ['ok' => true, 'coupon' => $c, 'discount' => round(self::discount_for($c, $subtotal), 2)];
    }

    /** Give a use back (order creation failed after the coupon was consumed). */
    public static function release(array $c): void {
        global $wpdb;
        $wpdb->query($wpdb->prepare(
            "UPDATE {$wpdb->postmeta} SET meta_value = GREATEST(CAST(meta_value AS SIGNED) - 1, 0) WHERE post_id = %d AND meta_key = 'usage_count'",
            $c['id']
        ));
        wp_cache_delete($c['id'], 'post_meta');
    }

    /** Atomically take one use; false when the usage limit was reached in the meantime. */
    public static function consume(array $c): bool {
        global $wpdb;
        add_post_meta($c['id'], 'usage_count', 0, true);
        if (!$c['max_uses']) {
            update_post_meta($c['id'], 'usage_count', (int) get_post_meta($c['id'], 'usage_count', true) + 1);
            return true;
        }
        $rows = $wpdb->query($wpdb->prepare(
            "UPDATE {$wpdb->postmeta} SET meta_value = CAST(meta_value AS UNSIGNED) + 1
             WHERE post_id = %d AND meta_key = 'usage_count' AND CAST(meta_value AS UNSIGNED) < %d",
            $c['id'], $c['max_uses']
        ));
        wp_cache_delete($c['id'], 'post_meta');
        return (bool) $rows;
    }
}
