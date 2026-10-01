<?php
/**
 * URL structure of the original storefront:
 *   /collections            -> redirects to /collections/all
 *   /collections/<slug>     -> category listing (several slugs may be joined with "+")
 *   /pages/<slug>           -> static page (contact is built in)
 *   /products/<slug>        -> single product (WooCommerce product base, set by the CMS plugin)
 */
defined('ABSPATH') || exit;

const NF_ROUTES_VERSION = '2';

add_action('init', static function () {
    add_rewrite_rule('^collections/?$', 'index.php?nf_collection=__index', 'top');
    add_rewrite_rule('^collections/([^/]+)/?$', 'index.php?nf_collection=$matches[1]', 'top');
    add_rewrite_rule('^pages/([^/]+)/?$', 'index.php?nf_page=$matches[1]', 'top');
}, 20);

add_filter('query_vars', static function ($vars) {
    $vars[] = 'nf_collection';
    $vars[] = 'nf_page';
    return $vars;
});

add_action('after_switch_theme', static function () {
    flush_rewrite_rules();
    update_option('nf_routes_version', NF_ROUTES_VERSION);
});
add_action('init', static function () {
    if (get_option('nf_routes_version') !== NF_ROUTES_VERSION) {
        flush_rewrite_rules(false);
        update_option('nf_routes_version', NF_ROUTES_VERSION);
    }
}, 99);

add_action('template_redirect', static function () {
    $col = get_query_var('nf_collection');
    if ($col === '__index') {
        wp_safe_redirect(nf_url('/collections/all'), 307);
        exit;
    }
    if ($col !== '' || get_query_var('nf_page') !== '') {
        global $wp_query;
        $wp_query->is_404 = false;
        status_header(200);
    }
}, 1);

add_filter('template_include', static function ($template) {
    if (get_query_var('nf_collection') !== '') {
        return get_theme_file_path('collection.php');
    }
    if (get_query_var('nf_page') !== '') {
        return get_theme_file_path('static-page.php');
    }
    if (is_singular('product')) {
        return get_theme_file_path('single-product.php');
    }
    return $template;
}, 99);

/** Our custom routes are already canonical (no trailing slash); do not let WordPress "fix" them. */
add_filter('redirect_canonical', static function ($redirect_url) {
    if (get_query_var('nf_collection') !== '' || get_query_var('nf_page') !== '') {
        return false;
    }
    return $redirect_url;
});
