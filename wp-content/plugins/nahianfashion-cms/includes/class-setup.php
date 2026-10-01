<?php
defined('ABSPATH') || exit;

/** Recommended store configuration, applied on activation and by `wp nf setup`. Idempotent. */
class NF_Setup {
    public static function run(): void {
        // URL structure of the original storefront: /products/<slug>, /collections/<category>, no trailing slash.
        $permalinks = (array) get_option('woocommerce_permalinks', []);
        $permalinks['product_base'] = 'products';
        $permalinks['category_base'] = 'collections';
        update_option('woocommerce_permalinks', $permalinks);
        global $wp_rewrite;
        $wp_rewrite->set_permalink_structure('/%postname%');

        // Store: Bangladesh, cash on delivery, no tax/stock management, coupons and reviews on, store open.
        $defaults = [
            'woocommerce_currency' => 'BDT', 'woocommerce_default_country' => 'BD', 'woocommerce_enable_coupons' => 'yes',
            'woocommerce_calc_taxes' => 'no', 'woocommerce_manage_stock' => 'no', 'woocommerce_enable_reviews' => 'yes',
            'woocommerce_enable_guest_checkout' => 'yes', 'woocommerce_coming_soon' => 'no', 'woocommerce_store_pages_only' => 'no',
        ];
        foreach ($defaults as $k => $v) {
            update_option($k, $v);
        }
        if (get_option('timezone_string') === '' && (float) get_option('gmt_offset') === 0.0) {
            update_option('timezone_string', 'Asia/Dhaka');
        }
        update_option('default_comment_status', 'closed');
        update_option('default_ping_status', 'closed');
        if (get_option('blogname') === 'My WordPress Site' || get_option('blogname') === '') {
            update_option('blogname', 'Nahian Fashion');
        }
        if (get_option('blogdescription') === 'Just another WordPress site') {
            update_option('blogdescription', '');
        }

        // Remove the untouched WordPress sample content.
        $hello = get_page_by_path('hello-world', OBJECT, 'post');
        if ($hello && $hello->post_content !== '' && strpos($hello->post_content, 'Welcome to WordPress') !== false) {
            wp_delete_post($hello->ID, true);
        }
        $sample = get_page_by_path('sample-page');
        if ($sample && strpos($sample->post_content, 'This is an example page') !== false) {
            wp_delete_post($sample->ID, true);
        }
        flush_rewrite_rules();
    }
}
