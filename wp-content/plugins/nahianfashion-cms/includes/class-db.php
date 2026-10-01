<?php
defined('ABSPATH') || exit;

/**
 * Custom tables for data that has no natural WooCommerce home.
 * Schema is versioned; dbDelta runs on activation and whenever the version changes.
 */
class NF_DB {
    const VERSION = '3';

    public static function init(): void {
        add_action('plugins_loaded', [__CLASS__, 'maybe_install']);
    }

    public static function table(string $name): string {
        global $wpdb;
        return $wpdb->prefix . 'nf_' . $name;
    }

    public static function maybe_install(): void {
        if (get_option('nf_db_version') !== self::VERSION) {
            self::install();
        }
    }

    public static function install(): void {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();
        $combo = self::table('combo_offers');
        $testi = self::table('testimonials');

        dbDelta("CREATE TABLE $combo (
            id varchar(64) NOT NULL,
            title varchar(255) NOT NULL,
            subtitle text NULL,
            price varchar(64) NOT NULL,
            original_price varchar(64) NULL,
            image_id bigint(20) unsigned NOT NULL DEFAULT 0,
            video_url text NULL,
            badge varchar(64) NULL,
            is_active tinyint(1) NOT NULL DEFAULT 1,
            display_order int(11) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY display_order (display_order)
        ) $charset;");

        dbDelta("CREATE TABLE $testi (
            id varchar(64) NOT NULL,
            type varchar(32) NOT NULL DEFAULT 'review',
            name varchar(255) NULL,
            image_id bigint(20) unsigned NOT NULL DEFAULT 0,
            video_url text NULL,
            quote text NULL,
            title varchar(255) NULL,
            rating tinyint(3) NOT NULL DEFAULT 5,
            display_order int(11) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY type_order (type, display_order)
        ) $charset;");

        $blocked = self::table('blocked_items');
        dbDelta("CREATE TABLE $blocked (
            id varchar(64) NOT NULL,
            type varchar(16) NOT NULL,
            value varchar(191) NOT NULL,
            reason text NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY value (value),
            KEY type (type)
        ) $charset;");

        $cache = self::table('steadfast_fraud_cache');
        dbDelta("CREATE TABLE $cache (
            phone varchar(20) NOT NULL,
            found tinyint(1) NOT NULL DEFAULT 0,
            total int(11) NOT NULL DEFAULT 0,
            success int(11) NOT NULL DEFAULT 0,
            cancel int(11) NOT NULL DEFAULT 0,
            success_rate int(11) NOT NULL DEFAULT 0,
            fraud_reports longtext NULL,
            fetched_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (phone)
        ) $charset;");

        $state = self::table('steadfast_api_state');
        dbDelta("CREATE TABLE $state (
            id varchar(32) NOT NULL,
            last_call_at datetime NULL,
            cooldown_until datetime NULL,
            window_start datetime NULL,
            window_count int(11) NOT NULL DEFAULT 0,
            day_start datetime NULL,
            day_count int(11) NOT NULL DEFAULT 0,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id)
        ) $charset;");

        update_option('nf_db_version', self::VERSION, false);
    }
}

/** Expose the custom tables to the theme through filters (the theme works without this plugin). */
add_filter('nf_combo_offers', static function ($default) {
    global $wpdb;
    $t = NF_DB::table('combo_offers');
    $rows = $wpdb->get_results("SELECT * FROM $t WHERE is_active = 1 ORDER BY display_order ASC, created_at ASC", ARRAY_A);
    foreach ($rows as &$r) {
        $r['image_url'] = $r['image_id'] ? (string) wp_get_attachment_url((int) $r['image_id']) : '';
    }
    return $rows ?: $default;
});

add_filter('nf_testimonials', static function ($default) {
    global $wpdb;
    $t = NF_DB::table('testimonials');
    $rows = $wpdb->get_results("SELECT * FROM $t ORDER BY display_order ASC, created_at ASC", ARRAY_A);
    foreach ($rows as &$r) {
        $r['image_url'] = $r['image_id'] ? (string) wp_get_attachment_url((int) $r['image_id']) : '';
    }
    return $rows ?: $default;
});
