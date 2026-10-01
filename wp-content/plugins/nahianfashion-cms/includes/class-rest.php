<?php
defined('ABSPATH') || exit;

/** REST endpoints used by the storefront JS (namespace nf/v1). */
class NF_REST {
    public static function init(): void {
        add_action('rest_api_init', [__CLASS__, 'routes']);
    }

    public static function routes(): void {
        register_rest_route('nf/v1', '/products', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'products'],
            'permission_callback' => '__return_true',
        ]);
        register_rest_route('nf/v1', '/orders/create', ['methods' => 'POST', 'callback' => ['NF_Orders', 'create'], 'permission_callback' => '__return_true']);
        register_rest_route('nf/v1', '/orders/draft', [
            ['methods' => 'POST', 'callback' => ['NF_Orders', 'draft'], 'permission_callback' => '__return_true'],
            ['methods' => 'DELETE', 'callback' => ['NF_Orders', 'delete_draft'], 'permission_callback' => '__return_true'],
        ]);
        register_rest_route('nf/v1', '/coupons/validate', ['methods' => 'POST', 'callback' => [__CLASS__, 'validate_coupon'], 'permission_callback' => '__return_true']);
        register_rest_route('nf/v1', '/products/meta', ['methods' => 'POST', 'callback' => [__CLASS__, 'products_meta'], 'permission_callback' => '__return_true']);
        register_rest_route('nf/v1', '/reviews', [
            'methods'             => 'POST',
            'callback'            => [__CLASS__, 'create_review'],
            'permission_callback' => '__return_true',
        ]);
    }

    public static function client_ip(): string {
        foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $k) {
            if (!empty($_SERVER[$k])) {
                $ip = trim(explode(',', (string) $_SERVER[$k])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return 'unknown';
    }

    /** Fixed-window limiter backed by transients. Returns true when the request is allowed. */
    public static function rate_limit(string $bucket, int $max, int $window): bool {
        $key = 'nf_rl_' . md5($bucket);
        $hits = (int) get_transient($key);
        if ($hits >= $max) {
            return false;
        }
        if ($hits === 0) {
            set_transient($key, 1, $window);
        } else {
            // Keep the original expiry: transients cannot be incremented in place, so re-set with remaining TTL.
            $timeout = (int) get_option('_transient_timeout_' . $key);
            $ttl = max(1, $timeout - time());
            set_transient($key, $hits + 1, $ttl);
        }
        return true;
    }

    /** Lightweight product list for header search: id, slug, name, price, media_urls. */
    public static function products(): WP_REST_Response {
        $out = [];
        $q = new WP_Query([
            'post_type' => 'product', 'post_status' => 'publish', 'posts_per_page' => -1,
            'orderby' => ['menu_order' => 'ASC', 'date' => 'DESC'], 'no_found_rows' => true,
        ]);
        foreach ($q->posts as $p) {
            $ids = json_decode((string) get_post_meta($p->ID, '_nf_media_ids', true), true) ?: [];
            $urls = [];
            foreach (array_slice($ids, 0, 1) as $id) {
                $u = wp_get_attachment_url((int) $id);
                if ($u) {
                    $urls[] = $u;
                }
            }
            $price = (string) get_post_meta($p->ID, '_nf_price', true);
            $out[] = [
                'id'         => (string) $p->ID,
                'slug'       => $p->post_name,
                'name'       => $p->post_title,
                'price'      => $price !== '' ? $price : (string) get_post_meta($p->ID, '_price', true),
                'media_urls' => $urls,
            ];
        }
        $res = new WP_REST_Response(['data' => $out]);
        $res->header('Cache-Control', 'public, max-age=60');
        return $res;
    }

    public static function validate_coupon(WP_REST_Request $req): WP_REST_Response {
        if (!self::rate_limit('coupon-validate:' . self::client_ip(), 20, HOUR_IN_SECONDS)) {
            return new WP_REST_Response(['error' => 'Too many requests.'], 429);
        }
        $b = $req->get_json_params() ?: [];
        $code = $b['code'] ?? null;
        $subtotal = $b['subtotal'] ?? null;
        if (!$code || !is_string($code)) {
            return new WP_REST_Response(['error' => 'Coupon code is required.'], 400);
        }
        if (!is_numeric($subtotal) || $subtotal < 0 || is_string($subtotal)) {
            return new WP_REST_Response(['error' => 'Invalid subtotal.'], 400);
        }
        $r = NF_Coupons::validate($code, (float) $subtotal);
        if (!$r['ok']) {
            return new WP_REST_Response(['error' => $r['error']], $r['status']);
        }
        $c = $r['coupon'];
        return new WP_REST_Response(['valid' => true, 'code' => $c['code'], 'type' => $c['type'], 'value' => $c['value'], 'discount' => $r['discount']]);
    }

    /** Colours and sizes for cart items that were added before this metadata existed. */
    public static function products_meta(WP_REST_Request $req): WP_REST_Response {
        $b = $req->get_json_params() ?: [];
        $out = [];
        foreach (array_slice((array) ($b['ids'] ?? []), 0, 50) as $id) {
            if (!is_scalar($id) || !ctype_digit((string) $id)) {
                continue;
            }
            $id = (int) $id;
            if (get_post_type($id) !== 'product' || get_post_status($id) !== 'publish' || get_post_meta($id, '_stock_status', true) === 'outofstock') {
                continue;
            }
            $out[] = [
                'id'     => (string) $id,
                'colors' => json_decode((string) get_post_meta($id, '_nf_colors', true), true) ?: [],
                'sizes'  => json_decode((string) get_post_meta($id, '_nf_sizes', true), true) ?: [],
            ];
        }
        return new WP_REST_Response(['data' => $out]);
    }

    public static function create_review(WP_REST_Request $req): WP_REST_Response {
        if (!self::rate_limit('review:' . self::client_ip(), 5, HOUR_IN_SECONDS)) {
            return new WP_REST_Response(['error' => 'Too many reviews submitted. Please try again later.'], 429);
        }
        $b = $req->get_json_params() ?: $req->get_params();
        $product_id = (int) ($b['product_id'] ?? 0);
        $name    = isset($b['name']) ? trim((string) $b['name']) : '';
        $comment = isset($b['comment']) ? trim((string) $b['comment']) : '';
        $rating  = $b['rating'] ?? null;

        if (!$product_id || $name === '' || !$rating || $comment === '') {
            return new WP_REST_Response(['error' => 'product_id, name, rating, and comment are required'], 400);
        }
        if (!is_numeric($rating) || (int) $rating != $rating || $rating < 1 || $rating > 5) {
            return new WP_REST_Response(['error' => 'Rating must be an integer between 1 and 5'], 400);
        }
        if (mb_strlen($name) > 100) {
            return new WP_REST_Response(['error' => 'Name must be 100 characters or fewer'], 400);
        }
        if (mb_strlen($comment) > 2000) {
            return new WP_REST_Response(['error' => 'Review must be 2000 characters or fewer'], 400);
        }
        $post = get_post($product_id);
        if (!$post || $post->post_type !== 'product') {
            return new WP_REST_Response(['error' => 'Internal server error'], 500);
        }
        $cid = wp_insert_comment([
            'comment_post_ID'  => $product_id,
            'comment_author'   => wp_strip_all_tags($name),
            'comment_content'  => wp_strip_all_tags($comment),
            'comment_type'     => 'review',
            'comment_approved' => 1,
            'comment_author_IP' => self::client_ip(),
        ]);
        if (!$cid) {
            return new WP_REST_Response(['error' => 'Internal server error'], 500);
        }
        update_comment_meta($cid, 'rating', (int) $rating);
        if (class_exists('WC_Comments')) {
            WC_Comments::clear_transients($product_id);
        }
        return new WP_REST_Response(['success' => true, 'review' => ['id' => (string) $cid]]);
    }
}
