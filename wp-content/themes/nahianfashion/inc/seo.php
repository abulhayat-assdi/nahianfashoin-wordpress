<?php
/**
 * Per-page SEO: templates call nf_set_seo() before get_header(); the values are printed in <head>.
 */
defined('ABSPATH') || exit;

function nf_set_seo(array $seo): void {
    $GLOBALS['nf_seo'] = $seo;
}

remove_action('wp_head', 'rel_canonical');

add_filter('pre_get_document_title', static function ($title) {
    if (!empty($GLOBALS['nf_seo']['title'])) {
        return $GLOBALS['nf_seo']['title'];
    }
    return $title;
}, 20);

add_action('wp_head', static function () {
    $seo = $GLOBALS['nf_seo'] ?? null;
    if (!$seo) {
        return;
    }
    $title = $seo['title'] ?? '';
    $desc  = $seo['description'] ?? '';
    $url   = $seo['canonical'] ?? '';
    $image = $seo['image'] ?? nf_logo_url();
    if (!empty($seo['noindex'])) {
        echo '<meta name="robots" content="noindex, ' . (!empty($seo['follow']) ? 'follow' : 'nofollow') . '" />' . "\n";
    }
    if ($desc !== '') {
        echo '<meta name="description" content="' . esc_attr($desc) . '" />' . "\n";
    }
    if ($url !== '') {
        echo '<link rel="canonical" href="' . esc_url($url) . '" />' . "\n";
    }
    if ($title !== '') {
        echo '<meta property="og:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '" />' . "\n";
    }
    if ($desc !== '') {
        echo '<meta property="og:description" content="' . esc_attr($desc) . '" />' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($desc) . '" />' . "\n";
    }
    if ($url !== '') {
        echo '<meta property="og:url" content="' . esc_url($url) . '" />' . "\n";
    }
    echo '<meta property="og:site_name" content="' . esc_attr(nf_settings()['site_name'] ?: 'Nahian Fashion') . '" />' . "\n";
    echo '<meta property="og:locale" content="en_US" />' . "\n";
    echo '<meta property="og:type" content="website" />' . "\n";
    echo '<meta property="og:image" content="' . esc_url($image) . '" />' . "\n";
    echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";
    echo '<meta name="twitter:image" content="' . esc_url($image) . '" />' . "\n";
    foreach ((array) ($seo['jsonld'] ?? []) as $ld) {
        echo '<script type="application/ld+json">' . wp_json_encode($ld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "</script>\n";
    }
}, 5);
