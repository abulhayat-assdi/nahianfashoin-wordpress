<?php
/**
 * Data helpers shared by the theme templates.
 *
 * Content lives in WordPress/WooCommerce (categories = product_cat terms, support pages =
 * pages with the `nf_section` meta) and in a few options written by the nahianfashion-cms
 * plugin: `nf_site_settings`, `nf_footer_config`, `nf_logo_id`. Every helper falls back to
 * safe defaults so the theme still renders when the plugin is inactive.
 */
defined('ABSPATH') || exit;

const NF_GTM_ID_DEFAULT = 'GTM-WBQH8573';

function nf_settings(): array {
    static $cache = null;
    if ($cache === null) {
        $saved = get_option('nf_site_settings', []);
        $cache = wp_parse_args(is_array($saved) ? $saved : [], [
            'site_name'            => 'Nahian Fashion',
            'site_tagline'         => '',
            'meta_description'     => '',
            'contact_email'        => '',
            'whatsapp_number'      => '',
            'phone_number'         => '',
            'instagram_url'        => '',
            'facebook_url'         => '',
            'currency_code'        => 'BDT',
            'currency_symbol'      => 'Tk',
            'footer_social_heading' => '',
        ]);
    }
    return $cache;
}

function nf_footer_config(): array {
    $saved = get_option('nf_footer_config', []);
    $saved = is_array($saved) ? $saved : [];
    return [
        'columns' => isset($saved['columns']) && is_array($saved['columns']) ? $saved['columns'] : [],
        'privacy' => !empty($saved['privacy']) ? (string) $saved['privacy'] : 'Privacy Policy',
        'terms'   => !empty($saved['terms']) ? (string) $saved['terms'] : 'Terms & Conditions',
    ];
}

function nf_logo_url(): string {
    $id = (int) get_option('nf_logo_id', 0);
    if ($id) {
        $url = wp_get_attachment_url($id);
        if ($url) {
            return $url;
        }
    }
    return get_theme_file_uri('assets/img/logo.png');
}

/** Lower-cased slug the way the original storefront derived link targets. */
function nf_slugify(string $text): string {
    $s = preg_replace('/[^a-z0-9]+/', '-', strtolower(trim($text)));
    return trim((string) $s, '-');
}

function nf_whatsapp_url(?string $value): string {
    $value = trim((string) $value);
    if ($value === '') {
        return '#';
    }
    if (stripos($value, 'http://') === 0 || stripos($value, 'https://') === 0) {
        return $value;
    }
    $digits = preg_replace('/\D/', '', $value);
    return $digits !== '' ? 'https://wa.me/' . $digits : '#';
}

function nf_absolute_url(?string $url, string $fallback = '#'): string {
    $url = trim((string) $url);
    if ($url === '') {
        return $fallback;
    }
    return preg_match('#^https?://#i', $url) ? $url : 'https://' . $url;
}

/** Current request path without the WordPress install sub-directory, always starting with "/". */
function nf_current_path(): string {
    $path = (string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $base = (string) wp_parse_url(home_url('/'), PHP_URL_PATH);
    if ($base !== '/' && strpos($path, $base) === 0) {
        $path = '/' . ltrim(substr($path, strlen($base)), '/');
    }
    return $path === '' ? '/' : $path;
}

function nf_url(string $path = '/'): string {
    return home_url($path);
}

/** @return WP_Term[] active product categories ordered by the admin-defined display order. */
function nf_categories(): array {
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    $cache = [];
    if (!taxonomy_exists('product_cat')) {
        return $cache;
    }
    $terms = get_terms([
        'taxonomy'   => 'product_cat',
        'hide_empty' => false,
        'exclude'    => [(int) get_option('default_product_cat')],
    ]);
    if (is_wp_error($terms)) {
        return $cache;
    }
    $terms = array_filter($terms, static function ($t) {
        $active = get_term_meta($t->term_id, 'nf_is_active', true);
        return $active === '' || (int) $active === 1;
    });
    usort($terms, static function ($a, $b) {
        $oa = (int) get_term_meta($a->term_id, 'nf_display_order', true);
        $ob = (int) get_term_meta($b->term_id, 'nf_display_order', true);
        return $oa <=> $ob ?: $a->term_id <=> $b->term_id;
    });
    return $cache = array_values($terms);
}

function nf_category_url(WP_Term $term): string {
    return nf_url('/collections/' . $term->slug);
}

/** Categories flagged "show in header"; falls back to the first six. */
function nf_header_categories(): array {
    $all = nf_categories();
    $flagged = array_values(array_filter($all, static function ($t) {
        return (int) get_term_meta($t->term_id, 'nf_show_in_header', true) === 1;
    }));
    return $flagged ?: array_slice($all, 0, 6);
}

/** @return WP_Post[] published support pages (footer "Support" column). */
function nf_support_pages(): array {
    return get_posts([
        'post_type'      => 'page',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'orderby'        => 'date',
        'order'          => 'ASC',
        'meta_key'       => 'nf_section',
        'meta_value'     => 'support',
    ]);
}

function nf_page_url(string $slug): string {
    return nf_url('/pages/' . $slug);
}

function nf_gtm_id(): string {
    return (string) apply_filters('nf_gtm_id', get_option('nf_gtm_id', NF_GTM_ID_DEFAULT));
}

/** Checkout/profile data for a logged-in customer (WordPress user + billing meta). */
function nf_customer_profile(int $user_id): array {
    $u = get_userdata($user_id);
    return [
        'id'      => (string) $user_id,
        'name'    => $u ? $u->display_name : '',
        'email'   => $u ? $u->user_email : '',
        'phone'   => (string) get_user_meta($user_id, 'billing_phone', true),
        'address' => (string) get_user_meta($user_id, 'billing_address_1', true),
    ];
}
