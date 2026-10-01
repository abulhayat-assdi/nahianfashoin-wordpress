<?php
/**
 * Plugin Name: Nahian Fashion CMS
 * Description: Custom admin panel, order tools, courier/fraud integrations and data importer for the Nahian Fashion storefront (requires WooCommerce and the Nahian Fashion theme).
 * Version: 1.0.0
 * Requires at least: 6.4
 * Requires PHP: 8.1
 * Requires Plugins: woocommerce
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
require_once NF_CMS_DIR . 'includes/class-products.php';
require_once NF_CMS_DIR . 'includes/class-setup.php';
require_once NF_CMS_DIR . 'includes/class-hardening.php';
require_once NF_CMS_DIR . 'includes/class-importer.php';
require_once NF_CMS_DIR . 'includes/class-import-admin.php';
require_once NF_CMS_DIR . 'includes/class-rest.php';
require_once NF_CMS_DIR . 'includes/class-admin-api.php';
require_once NF_CMS_DIR . 'includes/class-admin.php';

NF_DB::init();
NF_Orders::init();
NF_REST::init();
NF_Admin_API::init();
NF_Admin::init();
NF_Hardening::init();
add_action('admin_notices', static function () {
    if (!class_exists('WooCommerce') && current_user_can('activate_plugins')) {
        echo '<div class="notice notice-error"><p><strong>Nahian Fashion CMS</strong> needs the WooCommerce plugin to be installed and active.</p></div>';
    }
});
NF_Import_Admin::init();

if (defined('WP_CLI') && WP_CLI) {
    require_once NF_CMS_DIR . 'includes/class-cli.php';
    WP_CLI::add_command('nf', 'NF_CLI');
}

/** URL structure of the original storefront: /products/<slug>, /collections/<category>. */
register_activation_hook(__FILE__, static function () {
    NF_DB::install();
    NF_Setup::run();
});
