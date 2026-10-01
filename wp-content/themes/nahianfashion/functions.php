<?php
/**
 * Nahian Fashion theme bootstrap.
 */
defined('ABSPATH') || exit;

define('NF_THEME_VERSION', wp_get_theme()->get('Version') ?: '1.0.0');

require_once get_template_directory() . '/inc/icons.php';
require_once get_template_directory() . '/inc/helpers.php';
require_once get_template_directory() . '/inc/products.php';
require_once get_template_directory() . '/inc/seo.php';
require_once get_template_directory() . '/inc/routes.php';

add_action('after_setup_theme', static function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
    add_theme_support('woocommerce');
});

/** Fonts are loaded exactly like the original site (Google Fonts link in <head>). */
add_action('wp_head', static function () {
    echo '<link rel="preconnect" href="https://fonts.googleapis.com" />' . "\n";
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />' . "\n";
    echo '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet" />' . "\n";
}, 1);

add_action('wp_enqueue_scripts', static function () {
    $css = get_theme_file_path('assets/css/app.css');
    $js  = get_theme_file_path('assets/js/app.js');
    wp_enqueue_style('nf-app', get_theme_file_uri('assets/css/app.css'), [], file_exists($css) ? filemtime($css) : NF_THEME_VERSION);
    wp_enqueue_script('nf-app', get_theme_file_uri('assets/js/app.js'), [], file_exists($js) ? filemtime($js) : NF_THEME_VERSION, ['in_footer' => true, 'strategy' => 'defer']);
    $shop = get_theme_file_path('assets/js/shop.js');
    wp_enqueue_script('nf-shop', get_theme_file_uri('assets/js/shop.js'), ['nf-app'], file_exists($shop) ? filemtime($shop) : NF_THEME_VERSION, ['in_footer' => true, 'strategy' => 'defer']);
    wp_localize_script('nf-app', 'NF', [
        'home'    => untrailingslashit(home_url()),
        'rest'    => esc_url_raw(rest_url('nf/v1/')),
        'nonce'   => wp_create_nonce('wp_rest'),
        'loggedIn' => is_user_logged_in(),
    ]);
    // WooCommerce styles would alter the original design; the theme ships its own.
    foreach (['wc-add-to-cart', 'woocommerce', 'jquery-blockui', 'js-cookie', 'sourcebuster-js', 'wc-order-attribution', 'wc-cart-fragments'] as $handle) {
        wp_dequeue_script($handle);
    }
    wp_dequeue_style('wc-blocks-style');
    wp_dequeue_style('woocommerce-general');
    wp_dequeue_style('woocommerce-layout');
    wp_dequeue_style('woocommerce-smallscreen');
}, 99);
add_filter('woocommerce_enqueue_styles', '__return_empty_array');

/** Google Tag Manager, same container as the original site. */
add_action('wp_head', static function () {
    $id = nf_gtm_id();
    if ($id === '') {
        return;
    }
    ?>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',<?php echo wp_json_encode($id); ?>);</script>
    <?php
}, 2);

add_action('wp_body_open', static function () {
    $id = nf_gtm_id();
    if ($id === '') {
        return;
    }
    printf(
        '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=%s" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>',
        esc_attr($id)
    );
});

/** Organization + WebSite JSON-LD (same payload as the original root layout). */
add_action('wp_head', static function () {
    $site = home_url();
    $org = [
        '@context' => 'https://schema.org',
        '@type'    => 'Organization',
        'name'     => 'Nahian Fashion',
        'url'      => $site,
        'logo'     => nf_logo_url(),
        'contactPoint' => [
            '@type' => 'ContactPoint',
            'contactType' => 'customer service',
            'availableLanguage' => ['English', 'Bengali'],
        ],
    ];
    $web = [
        '@context' => 'https://schema.org',
        '@type'    => 'WebSite',
        'name'     => 'Nahian Fashion',
        'url'      => $site,
        'potentialAction' => [
            '@type' => 'SearchAction',
            'target' => ['@type' => 'EntryPoint', 'urlTemplate' => $site . '/collections/all?q={search_term_string}'],
            'query-input' => 'required name=search_term_string',
        ],
    ];
    echo '<script type="application/ld+json">' . wp_json_encode($org, JSON_UNESCAPED_SLASHES) . "</script>\n";
    echo '<script type="application/ld+json">' . wp_json_encode($web, JSON_UNESCAPED_SLASHES) . "</script>\n";
});

/** Favicon / touch icon = logo. */
add_action('wp_head', static function () {
    $logo = esc_url(nf_logo_url());
    echo '<link rel="icon" href="' . $logo . '" />' . "\n";
    echo '<link rel="apple-touch-icon" href="' . $logo . '" />' . "\n";
}, 3);

/** Document title like the original: "<Site> | <Tagline>" on home, "%s | <Site>" elsewhere. */
add_filter('pre_get_document_title', static function ($title) {
    $s = nf_settings();
    $name = $s['site_name'] ?: 'Nahian Fashion';
    if (is_front_page()) {
        return $s['site_tagline'] ? "$name | {$s['site_tagline']}" : $name;
    }
    return $title;
});
add_filter('document_title_separator', static fn() => '|');
add_filter('document_title_parts', static function ($parts) {
    $s = nf_settings();
    $parts['site'] = $s['site_name'] ?: 'Nahian Fashion';
    unset($parts['tagline']);
    return $parts;
});

add_action('wp_head', static function () {
    $s = nf_settings();
    if (is_front_page() && $s['meta_description']) {
        echo '<meta name="description" content="' . esc_attr($s['meta_description']) . '" />' . "\n";
    }
}, 4);

/** The storefront has its own search/cart UI; hide the WP admin bar for shop customers. */
add_filter('show_admin_bar', static fn($show) => current_user_can('manage_options') ? $show : false);

// Strip WP emoji/embeds noise that the original markup never had.
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('wp_head', 'wp_generator');
