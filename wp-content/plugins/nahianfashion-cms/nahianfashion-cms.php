<?php
/**
 * Plugin Name: Nahian Fashion CMS
 * Description: Custom admin panel, order tools, courier/fraud integrations and data importer for the Nahian Fashion storefront (requires WooCommerce and the Nahian Fashion theme).
 * Version: 1.0.0
 * Requires at least: 6.4
 * Requires PHP: 8.1
 * Author: Nahian Fashion
 * Text Domain: nahianfashion-cms
 */
defined('ABSPATH') || exit;

define('NF_CMS_VERSION', '1.0.0');
define('NF_CMS_FILE', __FILE__);
define('NF_CMS_DIR', plugin_dir_path(__FILE__));
define('NF_CMS_URL', plugin_dir_url(__FILE__));

require_once NF_CMS_DIR . 'includes/class-db.php';
require_once NF_CMS_DIR . 'includes/class-seed-reader.php';
require_once NF_CMS_DIR . 'includes/class-media.php';
require_once NF_CMS_DIR . 'includes/class-capi.php';
require_once NF_CMS_DIR . 'includes/class-coupons.php';
require_once NF_CMS_DIR . 'includes/class-orders.php';
require_once NF_CMS_DIR . 'includes/class-steadfast.php';
require_once NF_CMS_DIR . 'includes/class-importer.php';
require_once NF_CMS_DIR . 'includes/class-rest.php';

NF_DB::init();
NF_Orders::init();
NF_REST::init();

if (defined('WP_CLI') && WP_CLI) {
    require_once NF_CMS_DIR . 'includes/class-cli.php';
    WP_CLI::add_command('nf', 'NF_CLI');
}

/** URL structure of the original storefront: /products/<slug>, /collections/<category>. */
register_activation_hook(__FILE__, static function () {
    NF_DB::install();
    $permalinks = (array) get_option('woocommerce_permalinks', []);
    $permalinks['product_base']  = 'products';
    $permalinks['category_base'] = 'collections';
    update_option('woocommerce_permalinks', $permalinks);
    // The original storefront served URLs without a trailing slash.
    global $wp_rewrite;
    $wp_rewrite->set_permalink_structure('/%postname%');
    flush_rewrite_rules();
});
