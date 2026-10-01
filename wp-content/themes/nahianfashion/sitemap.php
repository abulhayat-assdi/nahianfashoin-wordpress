<?php
/**
 * /sitemap.xml - same entries and priorities as the original site (home, all products, products, categories, pages).
 */
defined('ABSPATH') || exit;
$now = gmdate('c');
$urls = [
    [nf_url('/'), $now, 'daily', '1.0'],
    [nf_url('/collections/all'), $now, 'daily', '0.9'],
];
foreach (nf_get_products() as $p) {
    if ($p['slug']) {
        $urls[] = [nf_url('/products/' . $p['slug']), get_post_time('c', true, (int) $p['id']), 'weekly', '0.85'];
    }
}
foreach (nf_categories() as $c) {
    $urls[] = [nf_category_url($c), $now, 'weekly', '0.75'];
}
foreach (get_posts(['post_type' => 'page', 'post_status' => 'publish', 'posts_per_page' => -1, 'meta_key' => 'nf_section']) as $page) {
    if (strtolower((string) get_post_meta($page->ID, 'nf_section', true)) !== 'blog') {
        $urls[] = [nf_page_url($page->post_name), get_post_modified_time('c', true, $page), 'monthly', '0.5'];
    }
}
status_header(200);
header('Content-Type: application/xml; charset=UTF-8');
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as [$loc, $mod, $freq, $prio]) {
    echo '<url><loc>' . esc_url($loc) . '</loc><lastmod>' . esc_html($mod) . '</lastmod><changefreq>' . $freq . '</changefreq><priority>' . $prio . '</priority></url>' . "\n";
}
echo '</urlset>';
exit;
