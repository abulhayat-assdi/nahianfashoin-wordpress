<?php
/**
 * Product data layer. Products are WooCommerce products (CPT `product`); the storefront's own
 * fields live in post meta written by the importer / admin panel:
 *   _nf_price, _nf_original_price, _nf_discount  display strings exactly as entered by the admin
 *   _nf_detail                                   short sub-title
 *   _nf_media_ids                                JSON array of attachment ids (first = card image)
 *   _nf_colors, _nf_sizes, _nf_faqs              JSON arrays
 *   _nf_video_url                                optional product video
 */
defined('ABSPATH') || exit;

function nf_meta_json(int $post_id, string $key): array {
    $v = json_decode((string) get_post_meta($post_id, $key, true), true);
    return is_array($v) ? $v : [];
}

/** "Tk 1,200" / "৳1,200" / "1200" -> "৳…" display string (same rules as the original ProductCard). */
function nf_price_display(?string $price): string {
    $price = (string) $price;
    if (strpos($price, '৳') !== false) {
        return $price;
    }
    if (strpos($price, 'Tk') !== false) {
        return str_replace('Tk', '৳', $price);
    }
    return '৳' . $price;
}

/** Numeric price like the original parsePrice(). */
function nf_parse_price($value): float {
    $stripped = preg_replace('/[^0-9.]/', '', (string) $value);
    $parts = explode('.', (string) $stripped);
    $cleaned = count($parts) > 1 ? implode('', array_slice($parts, 0, -1)) . '.' . end($parts) : $stripped;
    return is_numeric($cleaned) ? (float) $cleaned : 0.0;
}

function nf_product_category(int $post_id): ?WP_Term {
    $terms = get_the_terms($post_id, 'product_cat');
    if (!$terms || is_wp_error($terms)) {
        return null;
    }
    foreach ($terms as $t) {
        if ((int) $t->term_id !== (int) get_option('default_product_cat')) {
            return $t;
        }
    }
    return null;
}

function nf_review_stats(int $post_id): array {
    $comments = get_comments(['post_id' => $post_id, 'type' => 'review', 'status' => 'approve', 'orderby' => 'comment_date_gmt', 'order' => 'DESC']);
    $items = [];
    foreach ($comments as $c) {
        $items[] = [
            'id'         => (string) $c->comment_ID,
            'name'       => $c->comment_author,
            'rating'     => (int) get_comment_meta($c->comment_ID, 'rating', true),
            'comment'    => $c->comment_content,
            'created_at' => $c->comment_date_gmt . ' UTC',
        ];
    }
    return $items;
}

function nf_normalize_product(WP_Post $p): array {
    $id   = $p->ID;
    $ids  = array_map('intval', nf_meta_json($id, '_nf_media_ids'));
    $cat  = nf_product_category($id);
    $price = (string) get_post_meta($id, '_nf_price', true);
    if ($price === '') {
        $price = (string) get_post_meta($id, '_price', true);
    }
    return [
        'id'             => (string) $id,
        'slug'           => $p->post_name,
        'name'           => $p->post_title,
        'detail'         => (string) get_post_meta($id, '_nf_detail', true),
        'description'    => $p->post_content,
        'price'          => $price,
        'original_price' => (string) get_post_meta($id, '_nf_original_price', true),
        'discount'       => (string) get_post_meta($id, '_nf_discount', true),
        'image_ids'      => $ids,
        'image_id'       => $ids[0] ?? 0,
        'category_name'  => $cat ? trim($cat->name) : '',
        'category_slug'  => $cat ? $cat->slug : '',
        'unavailable'    => get_post_meta($id, '_stock_status', true) === 'outofstock',
        'colors'         => nf_meta_json($id, '_nf_colors'),
        'sizes'          => nf_meta_json($id, '_nf_sizes'),
        'faqs'           => nf_meta_json($id, '_nf_faqs'),
        'video_url'      => (string) get_post_meta($id, '_nf_video_url', true),
    ];
}

/**
 * @param array $args available_only (bool, default true), category_slug, exclude (id), limit
 * @return array[] normalized products ordered like the original (display order, then newest first)
 */
function nf_get_products(array $args = []): array {
    static $all = null;
    if ($all === null) {
        $q = new WP_Query([
            'post_type' => 'product', 'post_status' => 'publish', 'posts_per_page' => -1,
            'orderby' => ['menu_order' => 'ASC', 'date' => 'DESC'], 'no_found_rows' => true,
        ]);
        $all = array_map('nf_normalize_product', $q->posts);
    }
    $out = $all;
    if ($args['available_only'] ?? true) {
        $out = array_filter($out, static fn($p) => !$p['unavailable']);
    }
    if (!empty($args['category_slug'])) {
        $out = array_filter($out, static fn($p) => strcasecmp($p['category_slug'], (string) $args['category_slug']) === 0);
    }
    if (!empty($args['exclude'])) {
        $out = array_filter($out, static fn($p) => $p['id'] !== (string) $args['exclude']);
    }
    $out = array_values($out);
    return !empty($args['limit']) ? array_slice($out, 0, (int) $args['limit']) : $out;
}

/** <img> for an attachment, optionally filling its positioned parent like next/image's `fill`. */
function nf_img(int $attachment_id, string $size = 'large', array $attr = [], string $sizes = ''): string {
    if (!$attachment_id) {
        return '';
    }
    $defaults = ['decoding' => 'async'];
    if ($sizes !== '') {
        $defaults['sizes'] = $sizes;
    }
    return wp_get_attachment_image($attachment_id, $size, false, array_merge($defaults, $attr));
}

/** Build the add-to-cart payload attributes for a product card button. */
function nf_card_data_attrs(array $p): string {
    $attrs = [
        'data-id'       => $p['id'],
        'data-name'     => $p['name'],
        'data-price'    => $p['price'],
        'data-image'    => $p['image_id'] ? (string) wp_get_attachment_url($p['image_id']) : '',
        'data-detail'   => $p['detail'],
        'data-original' => $p['original_price'],
        'data-discount' => $p['discount'],
        'data-category' => $p['category_name'],
    ];
    $s = '';
    foreach ($attrs as $k => $v) {
        $s .= ' ' . $k . '="' . esc_attr($v) . '"';
    }
    return $s;
}

function nf_testimonials(): array {
    return (array) apply_filters('nf_testimonials', []);
}

function nf_combo_offers(): array {
    return (array) apply_filters('nf_combo_offers', []);
}

function nf_home_config(): array {
    $c = get_option('nf_home_config', []);
    return is_array($c) ? $c : [];
}
