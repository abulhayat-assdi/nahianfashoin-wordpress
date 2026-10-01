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
    public function coupons(): void {
        $n = 0;
        foreach ($this->seed->table('coupons') as $row) {
            $code = strtoupper(trim((string) $row['code']));
            $existing = get_posts(['post_type' => 'shop_coupon', 'post_status' => 'any', 'posts_per_page' => 1, 'title' => $code, 'fields' => 'ids']);
            $id = $existing ? (int) $existing[0] : wp_insert_post([
                'post_type' => 'shop_coupon', 'post_title' => $code, 'post_status' => 'publish', 'post_excerpt' => '',
            ]);
            wp_update_post(['ID' => $id, 'post_status' => NF_Seed_Reader::bool($row['is_active']) ? 'publish' : 'draft']);
            update_post_meta($id, 'discount_type', $row['type'] === 'percent' ? 'percent' : 'fixed_cart');
            update_post_meta($id, 'coupon_amount', (string) (float) $row['value']);
            update_post_meta($id, 'minimum_amount', $row['min_order'] !== null ? (string) (float) $row['min_order'] : '');
            update_post_meta($id, 'usage_limit', (int) $row['max_uses']);
            update_post_meta($id, 'usage_count', (int) $row['used_count']);
            update_post_meta($id, 'date_expires', $row['expires_at'] ? strtotime($row['expires_at'] . ' UTC') : '');
            update_post_meta($id, '_nf_legacy_id', $row['id']);
            $n++;
        }
        $this->say("$n coupons imported.");
    }

    public function blocked(): void {
        global $wpdb;
        $t = NF_DB::table('blocked_items');
        $n = 0;
        foreach ($this->seed->table('blocked_items') as $row) {
            $wpdb->replace($t, [
                'id' => $row['id'], 'type' => $row['type'], 'value' => $row['value'],
                'reason' => $row['reason'] ?? 'No reason specified', 'created_at' => self::ts($row['created_at']),
            ]);
            $n++;
        }
        $this->say("$n blocked items imported.");
    }

    public function fraud_cache(): void {
        global $wpdb;
        $t = NF_DB::table('steadfast_fraud_cache');
        $n = 0;
        foreach ($this->seed->table('steadfast_fraud_cache') as $row) {
            $wpdb->replace($t, [
                'phone' => $row['phone'], 'found' => NF_Seed_Reader::bool($row['found']) ? 1 : 0, 'total' => (int) $row['total'],
                'success' => (int) $row['success'], 'cancel' => (int) $row['cancel'], 'success_rate' => (int) $row['success_rate'],
                'fraud_reports' => $row['fraud_reports'] ?? '[]', 'fetched_at' => self::ts($row['fetched_at']), 'updated_at' => self::ts($row['updated_at']),
            ]);
            $n++;
        }
        $this->say("$n fraud-cache rows imported.");
    }

    private static function ts(?string $pg): string {
        $t = $pg ? strtotime($pg . ' UTC') : false;
        return gmdate('Y-m-d H:i:s', $t ?: time());
    }

    public function products(): void {
        if (!class_exists('WC_Product_Simple')) {
            $this->say('WooCommerce is not active: skipping products.');
            return;
        }
        $n = 0;
        foreach ($this->seed->table('products') as $row) {
            $found = get_posts([
                'post_type' => 'product', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids',
                'meta_key' => '_nf_legacy_id', 'meta_value' => $row['id'],
            ]);
            try {
                NF_Products::save([
                    'name' => $row['name'], 'slug' => $row['slug'], 'description' => (string) $row['description'],
                    'price' => $row['price'], 'original_price' => $row['original_price'] ?? '', 'discount' => $row['discount'] ?? '',
                    'detail' => $row['detail'] ?? '', 'video_url' => $row['video_url'] ?? '',
                    'is_available' => NF_Seed_Reader::bool($row['is_available']), 'is_featured' => NF_Seed_Reader::bool($row['is_featured']),
                    'is_gift' => NF_Seed_Reader::bool($row['is_gift']), 'display_order' => (int) $row['display_order'],
                    'category' => trim((string) $row['category']), 'created_at' => gmdate('c', strtotime($row['created_at'] . ' UTC')),
                    'media_urls' => NF_Seed_Reader::json($row['media_urls']) ?: [], 'colors' => NF_Seed_Reader::json($row['colors']) ?: [],
                    'sizes' => NF_Seed_Reader::json($row['sizes']) ?: [], 'faqs' => NF_Seed_Reader::json($row['faqs']) ?: [],
                    'steeping' => NF_Seed_Reader::json($row['steeping'] ?? null), '_legacy_id' => $row['id'],
                ], $found ? (int) $found[0] : null);
                $n++;
            } catch (Throwable $e) {
                $this->say("Product '{$row['name']}' failed: " . $e->getMessage());
            }
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
            'data'         => $data,
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
