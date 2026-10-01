<?php
defined('ABSPATH') || exit;

/**
 * Converts between WooCommerce products and the storefront's product row (the shape the admin panel and the
 * original API use): media_urls[], category (name), price strings, sizes/colors/faqs ... and saves it back.
 */
class NF_Products {
    public static function json_meta(int $id, string $key): array {
        $v = json_decode((string) get_post_meta($id, $key, true), true);
        return is_array($v) ? $v : [];
    }

    /** Attachment id for a media URL without downloading anything (imported source URL or WordPress URL). */
    public static function attachment_lookup(?string $url): int {
        $url = trim((string) $url);
        if ($url === '') {
            return 0;
        }
        $found = get_posts([
            'post_type' => 'attachment', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids',
            'meta_key' => '_nf_source_url', 'meta_value' => $url,
        ]);
        return $found ? (int) $found[0] : (int) attachment_url_to_postid($url);
    }

    /** Attachment id for a media URL: matches imported source URLs, then WordPress URLs; external URLs are sideloaded. */
    public static function attachment_for_url(?string $url): int {
        $url = trim((string) $url);
        if ($url === '') {
            return 0;
        }
        $found = get_posts([
            'post_type' => 'attachment', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids',
            'meta_key' => '_nf_source_url', 'meta_value' => $url,
        ]);
        if ($found) {
            return (int) $found[0];
        }
        $id = (int) attachment_url_to_postid($url);
        if ($id) {
            return $id;
        }
        return preg_match('#^https?://#i', $url) ? NF_Media::sideload($url) : 0;
    }

    public static function to_row(WP_Post $p): array {
        $id = $p->ID;
        $urls = [];
        foreach (array_map('intval', self::json_meta($id, '_nf_media_ids')) as $aid) {
            $u = wp_get_attachment_url($aid);
            if ($u) {
                $urls[] = $u;
            }
        }
        $cat = null;
        $terms = get_the_terms($id, 'product_cat');
        if ($terms && !is_wp_error($terms)) {
            foreach ($terms as $t) {
                if ((int) $t->term_id !== (int) get_option('default_product_cat')) {
                    $cat = $t;
                    break;
                }
            }
        }
        $steep = json_decode((string) get_post_meta($id, '_nf_steeping', true), true);
        return [
            'id'             => (string) $id,
            'slug'           => $p->post_name,
            'name'           => $p->post_title,
            'detail'         => ($v = get_post_meta($id, '_nf_detail', true)) !== '' ? $v : null,
            'description'    => $p->post_content !== '' ? $p->post_content : null,
            'price'          => (string) (get_post_meta($id, '_nf_price', true) !== '' ? get_post_meta($id, '_nf_price', true) : get_post_meta($id, '_price', true)),
            'original_price' => ($v = get_post_meta($id, '_nf_original_price', true)) !== '' ? $v : null,
            'discount'       => ($v = get_post_meta($id, '_nf_discount', true)) !== '' ? $v : null,
            'per_cup_price'  => null,
            'packaging'      => null,
            'media_urls'     => $urls,
            'category'       => $cat ? $cat->name : '',
            'is_available'   => get_post_meta($id, '_stock_status', true) !== 'outofstock',
            'is_featured'    => has_term('featured', 'product_visibility', $p),
            'is_gift'        => (bool) get_post_meta($id, '_nf_is_gift', true),
            'faqs'           => self::json_meta($id, '_nf_faqs'),
            'steeping'       => is_array($steep) ? $steep : null,
            'colors'         => self::json_meta($id, '_nf_colors'),
            'sizes'          => self::json_meta($id, '_nf_sizes'),
            'video_url'      => ($v = get_post_meta($id, '_nf_video_url', true)) !== '' ? $v : null,
            'display_order'  => (int) $p->menu_order,
            'created_at'     => gmdate('c', strtotime($p->post_date_gmt . ' UTC')),
        ];
    }

    private static function term_for_name(string $name): int {
        $name = trim($name);
        if ($name === '') {
            return 0;
        }
        foreach (get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false]) as $t) {
            if (strtolower(trim($t->name)) === strtolower($name)) {
                return (int) $t->term_id;
            }
        }
        $r = wp_insert_term($name, 'product_cat');
        return is_wp_error($r) ? 0 : (int) $r['term_id'];
    }

    /** Creates or updates a product from a row (any subset of the fields when updating). Returns the product id. */
    public static function save(array $row, ?int $id = null): int {
        $product = $id ? wc_get_product($id) : new WC_Product_Simple();
        if (!$product) {
            throw new RuntimeException('Product not found');
        }
        $has = static fn(string $k) => array_key_exists($k, $row);

        if ($has('name')) { $product->set_name((string) $row['name']); }
        if ($has('slug') && $row['slug'] !== '' && $row['slug'] !== null) { $product->set_slug(sanitize_title((string) $row['slug'])); }
        if ($has('description')) { $product->set_description((string) $row['description']); }
        if (!$id) { $product->set_status('publish'); $product->set_catalog_visibility('visible'); $product->set_manage_stock(false); }

        if ($has('price') || $has('original_price')) {
            $price_s = (string) ($row['price'] ?? get_post_meta((int) $id, '_nf_price', true));
            $orig_s = (string) ($row['original_price'] ?? get_post_meta((int) $id, '_nf_original_price', true));
            $price = NF_Orders::parse_price($price_s);
            $orig = NF_Orders::parse_price($orig_s);
            if ($orig > $price) {
                $product->set_regular_price((string) $orig);
                $product->set_sale_price((string) $price);
            } else {
                $product->set_regular_price((string) $price);
                $product->set_sale_price('');
            }
        }
        if ($has('is_available')) { $product->set_stock_status($row['is_available'] ? 'instock' : 'outofstock'); }
        if ($has('is_featured')) { $product->set_featured((bool) $row['is_featured']); }
        if ($has('display_order')) { $product->set_menu_order((int) $row['display_order']); }
        if ($has('category')) {
            $tid = self::term_for_name((string) $row['category']);
            $product->set_category_ids($tid ? [$tid] : []);
        }

        $old_ids = $id ? array_map('intval', self::json_meta($id, '_nf_media_ids')) : [];
        $ids = null;
        if ($has('media_urls')) {
            $ids = [];
            foreach ((array) $row['media_urls'] as $url) {
                if (is_string($url) && ($aid = self::attachment_for_url($url))) {
                    $ids[] = $aid;
                }
            }
            $product->set_image_id($ids[0] ?? 0);
            $product->set_gallery_image_ids(array_slice($ids, 1));
        }
        if ($has('created_at') && $row['created_at']) {
            $ts = strtotime((string) $row['created_at']);
            if ($ts) { $product->set_date_created($ts); }
        }
        $pid = $product->save();

        $str = static fn($v) => ($v === null) ? '' : (string) $v;
        foreach (['detail' => '_nf_detail', 'price' => '_nf_price', 'original_price' => '_nf_original_price', 'discount' => '_nf_discount', 'video_url' => '_nf_video_url'] as $k => $meta) {
            if ($has($k)) { update_post_meta($pid, $meta, $str($row[$k])); }
        }
        if ($ids !== null) { update_post_meta($pid, '_nf_media_ids', wp_json_encode($ids)); }
        if ($has('colors')) {
            $colors = [];
            foreach ((array) $row['colors'] as $c) {
                if (is_string($c) && (strpos($c, 'http') === 0) && ($aid = self::attachment_for_url($c))) {
                    $colors[] = (string) wp_get_attachment_url($aid);
                } else {
                    $colors[] = $c;
                }
            }
            update_post_meta($pid, '_nf_colors', wp_json_encode($colors));
        }
        foreach (['sizes' => '_nf_sizes', 'faqs' => '_nf_faqs'] as $k => $meta) {
            if ($has($k)) { update_post_meta($pid, $meta, wp_json_encode(array_values((array) $row[$k]))); }
        }
        if ($has('steeping')) { update_post_meta($pid, '_nf_steeping', wp_json_encode($row['steeping'])); }
        if ($has('is_gift')) { update_post_meta($pid, '_nf_is_gift', $row['is_gift'] ? 1 : 0); }
        if (!empty($row['_legacy_id'])) { update_post_meta($pid, '_nf_legacy_id', $row['_legacy_id']); }

        if ($ids !== null) { self::delete_unused_media(array_diff($old_ids, $ids), $pid); }
        return (int) $pid;
    }

    /** Removes media that no product references any more (the original deleted replaced files from storage). */
    public static function delete_unused_media(array $attachment_ids, int $except_product = 0): void {
        global $wpdb;
        foreach ($attachment_ids as $aid) {
            $aid = (int) $aid;
            if (!$aid || get_post_type($aid) !== 'attachment') {
                continue;
            }
            $used = $wpdb->get_var($wpdb->prepare(
                "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_nf_media_ids' AND post_id <> %d AND (meta_value LIKE %s OR meta_value LIKE %s OR meta_value LIKE %s OR meta_value LIKE %s) LIMIT 1",
                $except_product, '[' . $aid . ',%', '%,' . $aid . ',%', '%,' . $aid . ']', '[' . $aid . ']'
            ));
            if (!$used) {
                wp_delete_attachment($aid, true);
            }
        }
    }

    public static function delete(int $id): void {
        $ids = array_map('intval', self::json_meta($id, '_nf_media_ids'));
        wp_delete_post($id, true);
        self::delete_unused_media($ids);
    }
}
