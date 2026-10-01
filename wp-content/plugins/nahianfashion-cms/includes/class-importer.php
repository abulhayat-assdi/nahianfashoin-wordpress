<?php
defined('ABSPATH') || exit;

/**
 * Imports the PostgreSQL seed (data/seed/nahianfashion_seed.sql) into WordPress/WooCommerce.
 * Every step is idempotent: re-running updates existing records (matched by the legacy id kept
 * in meta/options) instead of duplicating them.
 */
class NF_Importer {
    private NF_Seed_Reader $seed;
    /** @var callable */
    private $log;

    public function __construct(NF_Seed_Reader $seed, ?callable $log = null) {
        $this->seed = $seed;
        $this->log = $log ?: static function ($m) {};
    }

    private function say(string $m): void {
        ($this->log)($m);
    }

    public function settings(): void {
        $row = $this->seed->table('site_settings')[0] ?? null;
        if (!$row) {
            return;
        }
        unset($row['id']);
        update_option('nf_site_settings', $row, false);
        $this->say('Site settings imported.');
    }

    public function footer(): void {
        $row = $this->seed->table('footer_config')[0] ?? null;
        if (!$row) {
            return;
        }
        update_option('nf_footer_config', [
            'columns'    => NF_Seed_Reader::json($row['columns'] ?? null) ?: [],
            'privacy'    => $row['privacy'] ?? null,
            'terms'      => $row['terms'] ?? null,
            'newsletter' => $row['newsletter'] ?? null,
            'social'     => $row['social'] ?? null,
            'ticker'     => NF_Seed_Reader::json($row['ticker'] ?? null),
        ], false);
        $this->say('Footer config imported.');
    }

    /** @return array<string,int> legacy category id => term id */
    public function categories(): array {
        $map = [];
        if (!taxonomy_exists('product_cat')) {
            $this->say('WooCommerce is not active: skipping categories.');
            return $map;
        }
        foreach ($this->seed->table('categories') as $row) {
            $name = trim((string) $row['name']);
            $slug = sanitize_title((string) ($row['slug'] ?: $name));
            $existing = get_terms([
                'taxonomy' => 'product_cat', 'hide_empty' => false, 'number' => 1,
                'meta_key' => 'nf_legacy_id', 'meta_value' => $row['id'],
            ]);
            if ($existing && !is_wp_error($existing)) {
                $term_id = (int) $existing[0]->term_id;
                wp_update_term($term_id, 'product_cat', ['name' => $name, 'slug' => $slug]);
            } else {
                $res = wp_insert_term($name, 'product_cat', ['slug' => $slug]);
                if (is_wp_error($res)) {
                    $this->say("Category '$name' failed: " . $res->get_error_message());
                    continue;
                }
                $term_id = (int) $res['term_id'];
            }
            update_term_meta($term_id, 'nf_legacy_id', $row['id']);
            update_term_meta($term_id, 'nf_display_order', (int) $row['display_order']);
            update_term_meta($term_id, 'nf_is_active', NF_Seed_Reader::bool($row['is_active']) ? 1 : 0);
            update_term_meta($term_id, 'nf_show_in_header', NF_Seed_Reader::bool($row['show_in_header']) ? 1 : 0);
            update_term_meta($term_id, 'nf_show_in_footer', NF_Seed_Reader::bool($row['show_in_footer']) ? 1 : 0);
            $img = NF_Media::sideload($row['image_url']);
            if ($img) {
                update_term_meta($term_id, 'thumbnail_id', $img);
            }
            $map[$row['id']] = $term_id;
        }
        $this->say(sprintf('%d categories imported.', count($map)));
        return $map;
    }

    /** Support/info pages become regular WordPress pages (blog pages are intentionally skipped). */
    public function pages(): void {
        $n = 0;
        foreach ($this->seed->table('pages') as $row) {
            if ($row['section'] === 'blog') {
                continue;
            }
            $found = get_posts([
                'post_type' => 'page', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids',
                'meta_key' => 'nf_legacy_id', 'meta_value' => $row['id'],
            ]);
            $post = [
                'post_type'    => 'page',
                'post_status'  => NF_Seed_Reader::bool($row['is_published']) ? 'publish' : 'draft',
                'post_title'   => $row['title'],
                'post_name'    => $row['slug'],
                'post_content' => (string) $row['content'],
            ];
            if ($found) {
                $post['ID'] = (int) $found[0];
                $id = wp_update_post($post, true);
            } else {
                $id = wp_insert_post($post, true);
            }
            if (is_wp_error($id)) {
                $this->say("Page '{$row['title']}' failed: " . $id->get_error_message());
                continue;
            }
            update_post_meta($id, 'nf_legacy_id', $row['id']);
            update_post_meta($id, 'nf_section', $row['section']);
            update_post_meta($id, 'nf_show_in_footer', NF_Seed_Reader::bool($row['show_in_footer']) ? 1 : 0);
            $img = NF_Media::sideload($row['header_image']);
            if ($img) {
                update_post_meta($id, 'nf_header_image_id', $img);
            }
            $n++;
        }
        $this->say("$n pages imported.");
    }
}
