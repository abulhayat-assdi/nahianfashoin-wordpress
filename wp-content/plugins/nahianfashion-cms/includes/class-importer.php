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
                'meta_query' => [['key' => 'nf_legacy_id', 'value' => $row['id']]],
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
    private static function ts(?string $pg): string {
        $t = $pg ? strtotime($pg . ' UTC') : false;
        return gmdate('Y-m-d H:i:s', $t ?: time());
    }

    /** @param array<string,int> $cat_map legacy category id => term id (unused; products reference categories by name) */
    public function products(): void {
        if (!class_exists('WC_Product_Simple')) {
            $this->say('WooCommerce is not active: skipping products.');
            return;
        }
        $terms_by_name = [];
        foreach (nf_import_categories() as $t) {
            $terms_by_name[strtolower(trim($t->name))] = (int) $t->term_id;
        }
        $n = 0;
        foreach ($this->seed->table('products') as $row) {
            $found = get_posts([
                'post_type' => 'product', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids',
                'meta_key' => '_nf_legacy_id', 'meta_value' => $row['id'],
            ]);
            $product = $found ? wc_get_product((int) $found[0]) : new WC_Product_Simple();
            $product->set_name((string) $row['name']);
            $product->set_slug((string) $row['slug']);
            $product->set_status('publish');
            $product->set_description((string) $row['description']);
            $product->set_catalog_visibility('visible');
            $price = nf_import_parse_price($row['price']);
            $orig  = nf_import_parse_price($row['original_price']);
            if ($orig > $price) {
                $product->set_regular_price((string) $orig);
                $product->set_sale_price((string) $price);
            } else {
                $product->set_regular_price((string) $price);
                $product->set_sale_price('');
            }
            $product->set_manage_stock(false);
            $product->set_stock_status(NF_Seed_Reader::bool($row['is_available']) ? 'instock' : 'outofstock');
            $product->set_featured(NF_Seed_Reader::bool($row['is_featured']));
            $product->set_menu_order((int) $row['display_order']);
            $product->set_date_created(self::ts($row['created_at']));

            $media = NF_Seed_Reader::json($row['media_urls']) ?: [];
            $ids = [];
            foreach ($media as $url) {
                $id = NF_Media::sideload((string) $url);
                if ($id) {
                    $ids[] = $id;
                }
            }
            $product->set_image_id($ids[0] ?? 0);
            $product->set_gallery_image_ids(array_slice($ids, 1));

            $key = strtolower(trim((string) $row['category']));
            if (isset($terms_by_name[$key])) {
                $product->set_category_ids([$terms_by_name[$key]]);
            } else {
                $this->say("Product '{$row['name']}': no category matches '{$row['category']}'.");
            }
            $pid = $product->save();

            // Colors may be hex/CSS values or image URLs; image URLs are sideloaded and replaced by their WP URL.
            $colors = [];
            foreach ((NF_Seed_Reader::json($row['colors']) ?: []) as $c) {
                if (is_string($c) && (strpos($c, 'http') === 0 || strpos($c, '/') === 0)) {
                    $id = NF_Media::sideload($c);
                    $colors[] = $id ? (string) wp_get_attachment_url($id) : $c;
                } else {
                    $colors[] = $c;
                }
            }
            update_post_meta($pid, '_nf_legacy_id', $row['id']);
            update_post_meta($pid, '_nf_price', (string) $row['price']);
            update_post_meta($pid, '_nf_original_price', (string) ($row['original_price'] ?? ''));
            update_post_meta($pid, '_nf_discount', (string) ($row['discount'] ?? ''));
            update_post_meta($pid, '_nf_detail', (string) ($row['detail'] ?? ''));
            update_post_meta($pid, '_nf_media_ids', wp_json_encode($ids));
            update_post_meta($pid, '_nf_colors', wp_json_encode($colors));
            update_post_meta($pid, '_nf_sizes', wp_json_encode(NF_Seed_Reader::json($row['sizes']) ?: []));
            update_post_meta($pid, '_nf_faqs', wp_json_encode(NF_Seed_Reader::json($row['faqs']) ?: []));
            update_post_meta($pid, '_nf_video_url', (string) ($row['video_url'] ?? ''));
            update_post_meta($pid, '_nf_is_gift', NF_Seed_Reader::bool($row['is_gift']) ? 1 : 0);
            $n++;
        }
        $this->say("$n products imported.");
    }

    public function reviews(): void {
        $n = 0;
        foreach ($this->seed->table('product_reviews') as $row) {
            $pids = get_posts([
                'post_type' => 'product', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids',
                'meta_key' => '_nf_legacy_id', 'meta_value' => $row['product_id'],
            ]);
            if (!$pids) {
                continue;
            }
            $exists = get_comments(['meta_key' => 'nf_legacy_id', 'meta_value' => $row['id'], 'number' => 1, 'fields' => 'ids']);
            if ($exists) {
                continue;
            }
            $date = self::ts($row['created_at']);
            $cid = wp_insert_comment([
                'comment_post_ID'  => (int) $pids[0],
                'comment_author'   => $row['name'],
                'comment_content'  => $row['comment'],
                'comment_type'     => 'review',
                'comment_approved' => 1,
                'comment_date'     => get_date_from_gmt($date),
                'comment_date_gmt' => $date,
            ]);
            if ($cid) {
                update_comment_meta($cid, 'rating', (int) $row['rating']);
                update_comment_meta($cid, 'nf_legacy_id', $row['id']);
                $n++;
            }
        }
        foreach (get_posts(['post_type' => 'product', 'posts_per_page' => -1, 'fields' => 'ids', 'post_status' => 'any']) as $pid) {
            if (class_exists('WC_Comments')) {
                WC_Comments::clear_transients($pid);
            }
        }
        $this->say("$n reviews imported.");
    }

    public function home(): void {
        $row = $this->seed->table('home_config')[0] ?? null;
        if (!$row) {
            return;
        }
        $banners = [];
        foreach ((NF_Seed_Reader::json($row['banners']) ?: []) as $b) {
            $banners[] = [
                'id'       => (string) ($b['id'] ?? uniqid()),
                'image_id' => NF_Media::sideload($b['image_url'] ?? ''),
                'link'     => (string) ($b['link'] ?? ''),
            ];
        }
        $data = NF_Seed_Reader::json($row['data']) ?: [];
        update_option('nf_home_config', [
            'banners'      => $banners,
            'ticker_items' => NF_Seed_Reader::json($row['ticker_items']) ?: [],
            'hero_text'    => $data['hero_text'] ?? [],
        ], false);
        $this->say(sprintf('Home config imported (%d banners).', count($banners)));
    }

    public function combos(): void {
        global $wpdb;
        $t = NF_DB::table('combo_offers');
        $n = 0;
        foreach ($this->seed->table('combo_offers') as $row) {
            $wpdb->replace($t, [
                'id'             => $row['id'],
                'title'          => $row['title'],
                'subtitle'       => $row['subtitle'],
                'price'          => $row['price'],
                'original_price' => $row['original_price'],
                'image_id'       => NF_Media::sideload($row['image_url']),
                'video_url'      => $row['video_url'],
                'badge'          => $row['badge'],
                'is_active'      => NF_Seed_Reader::bool($row['is_active']) ? 1 : 0,
                'display_order'  => (int) $row['display_order'],
                'created_at'     => self::ts($row['created_at']),
            ]);
            $n++;
        }
        $this->say("$n combo offers imported.");
    }

    public function testimonials(): void {
        global $wpdb;
        $t = NF_DB::table('testimonials');
        $n = 0;
        foreach ($this->seed->table('testimonials') as $row) {
            $wpdb->replace($t, [
                'id'            => $row['id'],
                'type'          => $row['type'],
                'name'          => $row['name'],
                'image_id'      => NF_Media::sideload($row['image_url']),
                'video_url'     => $row['video_url'] ?? null,
                'quote'         => $row['quote'],
                'title'         => $row['title'],
                'rating'        => (int) ($row['rating'] ?? 5),
                'display_order' => (int) $row['display_order'],
                'created_at'    => self::ts($row['created_at']),
            ]);
            $n++;
        }
        $this->say("$n testimonials imported.");
    }
}

function nf_import_parse_price($value): float {
    $stripped = preg_replace('/[^0-9.]/', '', (string) $value);
    $parts = explode('.', (string) $stripped);
    $cleaned = count($parts) > 1 ? implode('', array_slice($parts, 0, -1)) . '.' . end($parts) : $stripped;
    return is_numeric($cleaned) ? (float) $cleaned : 0.0;
}

/** @return WP_Term[] */
function nf_import_categories(): array {
    $terms = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false]);
    return is_wp_error($terms) ? [] : $terms;
}
