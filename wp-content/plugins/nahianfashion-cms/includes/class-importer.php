<?php
defined('ABSPATH') || exit;

/**
 * Imports a PostgreSQL pg_dump (COPY format; the repo seed or a full live dump) into WordPress/WooCommerce.
 *
 * Every step is idempotent (records are matched by their legacy id) and resumable: run_step() processes rows
 * from an offset until a time budget is used up, so the same code serves WP-CLI and the browser importer
 * (Tools -> Nahian Fashion Import) on shared hosting with short request limits.
 */
class NF_Importer {
    /** step => [label, tables read] */
    const STEPS = [
        'settings'     => ['Site settings', ['site_settings']],
        'footer'       => ['Footer config', ['footer_config']],
        'categories'   => ['Categories', ['categories']],
        'pages'        => ['Support pages', ['pages']],
        'home'         => ['Home page (banners, hero text)', ['home_config']],
        'combos'       => ['Combo offers', ['combo_offers']],
        'testimonials' => ['Testimonials', ['testimonials']],
        'products'     => ['Products (+ images)', ['products']],
        'reviews'      => ['Product reviews', ['product_reviews']],
        'coupons'      => ['Coupons', ['coupons']],
        'blocked'      => ['Blocked list', ['blocked_items']],
        'fraud_cache'  => ['Steadfast fraud cache', ['steadfast_fraud_cache']],
        'orders'       => ['Orders', ['orders', 'order_items']],
    ];
    const TABLE_FOR_STEP = [
        'settings' => 'site_settings', 'footer' => 'footer_config', 'categories' => 'categories', 'pages' => 'pages', 'home' => 'home_config',
        'combos' => 'combo_offers', 'testimonials' => 'testimonials', 'products' => 'products', 'reviews' => 'product_reviews',
        'coupons' => 'coupons', 'blocked' => 'blocked_items', 'fraud_cache' => 'steadfast_fraud_cache', 'orders' => 'orders',
    ];

    private string $file;
    /** @var callable */
    private $log;
    private array $readers = [];
    private ?array $legacy_products = null;
    private ?array $items_by_order = null;
    public array $warnings = [];

    public function __construct(string $file, ?callable $log = null) {
        $this->file = $file;
        $this->log = $log ?: static function ($m) {};
    }

    private function say(string $m): void {
        ($this->log)($m);
    }

    private function warn(string $m): void {
        $this->warnings[] = $m;
        $this->say('! ' . $m);
    }

    private function reader(string $step): NF_Seed_Reader {
        if (!isset($this->readers[$step])) {
            $this->readers = [];
            $this->readers[$step] = new NF_Seed_Reader($this->file, self::STEPS[$step][1]);
        }
        return $this->readers[$step];
    }

    private function rows(string $step): array {
        return $this->reader($step)->table(self::TABLE_FOR_STEP[$step]);
    }

    public function count(string $step): int {
        return count($this->rows($step));
    }

    /**
     * Processes rows of a step starting at $offset until $budget seconds have passed.
     * @return array{next:int,total:int,done:bool}
     */
    public function run_step(string $step, int $offset = 0, float $budget = 20.0): array {
        if (!isset(self::STEPS[$step])) {
            throw new InvalidArgumentException("Unknown step: $step");
        }
        $rows = $this->rows($step);
        $total = count($rows);
        $start = microtime(true);
        $i = $offset;
        for (; $i < $total; $i++) {
            try {
                $this->{'row_' . $step}($rows[$i]);
            } catch (Throwable $e) {
                $this->warn(self::STEPS[$step][0] . ' row ' . ($i + 1) . ': ' . $e->getMessage());
            }
            if (microtime(true) - $start >= $budget) {
                $i++;
                break;
            }
        }
        return ['next' => $i, 'total' => $total, 'done' => $i >= $total];
    }

    /** CLI helper: runs the given steps to completion. */
    public function run_all(array $steps): void {
        foreach ($steps as $step) {
            if (!isset(self::STEPS[$step])) {
                $this->warn("Unknown step: $step");
                continue;
            }
            $offset = 0;
            do {
                $r = $this->run_step($step, $offset, 3600);
                $offset = $r['next'];
            } while (!$r['done']);
            $this->say(sprintf('%s: %d row(s)', self::STEPS[$step][0], $r['total']));
        }
    }

    private static function ts(?string $pg): string {
        $t = $pg ? strtotime($pg . ' UTC') : false;
        return gmdate('Y-m-d H:i:s', $t ?: time());
    }

    /* ───────────────────────── row processors ───────────────────────── */

    private function row_settings(array $row): void {
        unset($row['id']);
        update_option('nf_site_settings', $row, false);
    }

    private function row_footer(array $row): void {
        update_option('nf_footer_config', [
            'columns' => NF_Seed_Reader::json($row['columns'] ?? null) ?: [], 'privacy' => $row['privacy'] ?? null, 'terms' => $row['terms'] ?? null,
            'newsletter' => $row['newsletter'] ?? null, 'social' => $row['social'] ?? null, 'ticker' => NF_Seed_Reader::json($row['ticker'] ?? null),
        ], false);
    }

    private function row_categories(array $row): void {
        if (!taxonomy_exists('product_cat')) {
            throw new RuntimeException('WooCommerce is not active');
        }
        $name = trim((string) $row['name']);
        $slug = sanitize_term_title_for_import((string) ($row['slug'] ?: $name));
        $existing = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false, 'number' => 1, 'meta_query' => [['key' => 'nf_legacy_id', 'value' => $row['id']]]]);
        if ($existing && !is_wp_error($existing)) {
            $term_id = (int) $existing[0]->term_id;
            wp_update_term($term_id, 'product_cat', ['name' => $name, 'slug' => $slug]);
        } else {
            $res = wp_insert_term($name, 'product_cat', ['slug' => $slug]);
            if (is_wp_error($res)) {
                throw new RuntimeException("Category '$name': " . $res->get_error_message());
            }
            $term_id = (int) $res['term_id'];
        }
        update_term_meta($term_id, 'nf_legacy_id', $row['id']);
        update_term_meta($term_id, 'nf_display_order', (int) $row['display_order']);
        update_term_meta($term_id, 'nf_is_active', NF_Seed_Reader::bool($row['is_active']) ? 1 : 0);
        update_term_meta($term_id, 'nf_show_in_header', NF_Seed_Reader::bool($row['show_in_header']) ? 1 : 0);
        update_term_meta($term_id, 'nf_show_in_footer', NF_Seed_Reader::bool($row['show_in_footer']) ? 1 : 0);
        if ($img = NF_Media::sideload($row['image_url'])) {
            update_term_meta($term_id, 'thumbnail_id', $img);
        }
    }

    /** Support/info pages become regular WordPress pages (blog pages are intentionally skipped). */
    private function row_pages(array $row): void {
        if (strtolower((string) $row['section']) === 'blog') {
            return;
        }
        $found = get_posts(['post_type' => 'page', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids', 'meta_key' => 'nf_legacy_id', 'meta_value' => $row['id']]);
        $post = [
            'post_type' => 'page', 'post_status' => NF_Seed_Reader::bool($row['is_published']) ? 'publish' : 'draft',
            'post_title' => $row['title'], 'post_name' => $row['slug'], 'post_content' => (string) $row['content'],
        ];
        if ($found) {
            $post['ID'] = (int) $found[0];
            $id = wp_update_post($post, true);
        } else {
            $id = wp_insert_post($post, true);
        }
        if (is_wp_error($id)) {
            throw new RuntimeException("Page '{$row['title']}': " . $id->get_error_message());
        }
        update_post_meta($id, 'nf_legacy_id', $row['id']);
        update_post_meta($id, 'nf_section', $row['section']);
        update_post_meta($id, 'nf_show_in_footer', NF_Seed_Reader::bool($row['show_in_footer']) ? 1 : 0);
        if ($img = NF_Media::sideload($row['header_image'])) {
            update_post_meta($id, 'nf_header_image_id', $img);
        }
    }

    private function row_home(array $row): void {
        $banners = [];
        foreach ((NF_Seed_Reader::json($row['banners']) ?: []) as $b) {
            $banners[] = ['id' => (string) ($b['id'] ?? uniqid()), 'image_id' => NF_Media::sideload($b['image_url'] ?? ''), 'link' => (string) ($b['link'] ?? '')];
        }
        update_option('nf_home_config', [
            'banners' => $banners, 'ticker_items' => NF_Seed_Reader::json($row['ticker_items']) ?: [], 'data' => NF_Seed_Reader::json($row['data']) ?: [],
        ], false);
    }

    private function row_combos(array $row): void {
        global $wpdb;
        $wpdb->replace(NF_DB::table('combo_offers'), [
            'id' => $row['id'], 'title' => $row['title'], 'subtitle' => $row['subtitle'], 'price' => $row['price'], 'original_price' => $row['original_price'],
            'image_id' => NF_Media::sideload($row['image_url']), 'video_url' => $row['video_url'], 'badge' => $row['badge'],
            'is_active' => NF_Seed_Reader::bool($row['is_active']) ? 1 : 0, 'display_order' => (int) $row['display_order'], 'created_at' => self::ts($row['created_at']),
        ]);
    }

    private function row_testimonials(array $row): void {
        global $wpdb;
        $wpdb->replace(NF_DB::table('testimonials'), [
            'id' => $row['id'], 'type' => $row['type'], 'name' => $row['name'], 'image_id' => NF_Media::sideload($row['image_url']), 'video_url' => $row['video_url'] ?? null,
            'quote' => $row['quote'], 'title' => $row['title'], 'rating' => (int) ($row['rating'] ?? 5), 'display_order' => (int) $row['display_order'], 'created_at' => self::ts($row['created_at']),
        ]);
    }

    private function row_products(array $row): void {
        if (!class_exists('WC_Product_Simple')) {
            throw new RuntimeException('WooCommerce is not active');
        }
        $found = get_posts(['post_type' => 'product', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids', 'meta_key' => '_nf_legacy_id', 'meta_value' => $row['id']]);
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
        $this->legacy_products = null;
    }

    private function row_reviews(array $row): void {
        $pids = get_posts(['post_type' => 'product', 'post_status' => 'any', 'posts_per_page' => 1, 'fields' => 'ids', 'meta_key' => '_nf_legacy_id', 'meta_value' => $row['product_id']]);
        if (!$pids || get_comments(['meta_key' => 'nf_legacy_id', 'meta_value' => $row['id'], 'type' => 'review', 'number' => 1, 'fields' => 'ids'])) {
            return;
        }
        $date = self::ts($row['created_at']);
        $cid = wp_insert_comment([
            'comment_post_ID' => (int) $pids[0], 'comment_author' => $row['name'], 'comment_content' => $row['comment'], 'comment_type' => 'review',
            'comment_approved' => 1, 'comment_date' => get_date_from_gmt($date), 'comment_date_gmt' => $date,
        ]);
        if ($cid) {
            update_comment_meta($cid, 'rating', (int) $row['rating']);
            update_comment_meta($cid, 'nf_legacy_id', $row['id']);
            if (class_exists('WC_Comments')) {
                WC_Comments::clear_transients((int) $pids[0]);
            }
        }
    }

    private function row_coupons(array $row): void {
        $code = strtoupper(trim((string) $row['code']));
        $existing = get_posts(['post_type' => 'shop_coupon', 'post_status' => 'any', 'posts_per_page' => 1, 'title' => $code, 'fields' => 'ids']);
        $id = $existing ? (int) $existing[0] : wp_insert_post(['post_type' => 'shop_coupon', 'post_title' => $code, 'post_status' => 'publish', 'post_excerpt' => '']);
        wp_update_post(['ID' => $id, 'post_status' => NF_Seed_Reader::bool($row['is_active']) ? 'publish' : 'draft']);
        update_post_meta($id, 'discount_type', $row['type'] === 'percent' ? 'percent' : 'fixed_cart');
        update_post_meta($id, 'coupon_amount', (string) (float) $row['value']);
        update_post_meta($id, 'minimum_amount', $row['min_order'] !== null ? (string) (float) $row['min_order'] : '');
        update_post_meta($id, 'usage_limit', (int) $row['max_uses']);
        update_post_meta($id, 'usage_count', (int) $row['used_count']);
        update_post_meta($id, 'date_expires', $row['expires_at'] ? strtotime($row['expires_at'] . ' UTC') : '');
        update_post_meta($id, '_nf_legacy_id', $row['id']);
    }

    private function row_blocked(array $row): void {
        global $wpdb;
        $wpdb->replace(NF_DB::table('blocked_items'), ['id' => $row['id'], 'type' => $row['type'], 'value' => $row['value'], 'reason' => $row['reason'] ?? 'No reason specified', 'created_at' => self::ts($row['created_at'])]);
    }

    private function row_fraud_cache(array $row): void {
        global $wpdb;
        $wpdb->replace(NF_DB::table('steadfast_fraud_cache'), [
            'phone' => $row['phone'], 'found' => NF_Seed_Reader::bool($row['found']) ? 1 : 0, 'total' => (int) $row['total'], 'success' => (int) $row['success'], 'cancel' => (int) $row['cancel'],
            'success_rate' => (int) $row['success_rate'], 'fraud_reports' => $row['fraud_reports'] ?? '[]', 'fetched_at' => self::ts($row['fetched_at']), 'updated_at' => self::ts($row['updated_at']),
        ]);
    }

    private function product_for_legacy(string $legacy): ?int {
        if ($this->legacy_products === null) {
            global $wpdb;
            $this->legacy_products = [];
            foreach ($wpdb->get_results("SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_nf_legacy_id'", ARRAY_A) as $r) {
                if (get_post_type((int) $r['post_id']) === 'product') {
                    $this->legacy_products[$r['meta_value']] = (int) $r['post_id'];
                }
            }
        }
        return $this->legacy_products[$legacy] ?? null;
    }

    private function wp_media_url(?string $url): ?string {
        $url = trim((string) $url);
        if ($url === '') {
            return null;
        }
        $id = NF_Products::attachment_lookup($url);
        return $id ? (wp_get_attachment_url($id) ?: null) : null;
    }

    /** Orders of a live dump (customers are not imported: orders are guest orders with name/phone/address). */
    private function row_orders(array $row): void {
        if ($this->items_by_order === null) {
            $this->items_by_order = [];
            foreach ($this->reader('orders')->table('order_items') as $it) {
                $this->items_by_order[$it['order_id']][] = $it;
            }
        }
        $public = (string) $row['order_id'];
        $status = isset(NF_Orders::STATUSES[$row['status']]) ? $row['status'] : ($row['status'] === 'completed' ? 'delivered' : ($row['status'] === 'failed' ? 'payment_failed' : 'pending'));
        $lines = [];
        foreach ($this->items_by_order[$public] ?? [] as $it) {
            $pid = $this->product_for_legacy((string) $it['product_id']);
            $image = $this->wp_media_url($it['image_url']);
            if (!$image && $pid) {
                $first = array_map('intval', NF_Products::json_meta($pid, '_nf_media_ids'))[0] ?? 0;
                $image = $first ? wp_get_attachment_url($first) : null;
            }
            $color = $it['color'];
            if ($color && preg_match('#^https?://#i', $color)) {
                $color = $this->wp_media_url($color) ?: $color;
            }
            $lines[] = [
                'product_id' => $pid ? (string) $pid : (string) $it['product_id'], 'name' => $it['product_name'], 'price' => (float) $it['price'], 'quantity' => max(1, (int) $it['quantity']),
                'image' => (string) $image, 'size' => $it['size'], 'color' => $color,
            ];
        }
        $existing = NF_Orders::find_by_public_id($public);
        NF_Orders::build_order(
            $public, $status,
            ['name' => (string) $row['customer_name'], 'phone' => (string) $row['phone'], 'address' => (string) $row['address'], 'ip' => (string) ($row['ip_address'] ?? ''), 'draft_session' => $row['draft_session_id'] ?? ''],
            $lines, (float) $row['subtotal'], (float) $row['shipping'], (float) $row['discount'], null,
            [
                'total' => (float) $row['total'], 'date_created' => strtotime(self::ts($row['placed_at']) . ' UTC'), 'consignment_id' => $row['consignment_id'] ?? '',
                'amount_paid' => (float) $row['amount_paid'], 'capi_sent' => NF_Seed_Reader::bool($row['capi_sent'] ?? 'f'), 'payment_method' => $row['payment_method'] ?: 'cash', 'created_via' => 'nf-import',
            ],
            $existing
        );
    }
}

/** sanitize_title() keeping underscores like the original category slugs (e.g. fifa_jersey_2026). */
function sanitize_term_title_for_import(string $slug): string {
    return sanitize_title($slug);
}
