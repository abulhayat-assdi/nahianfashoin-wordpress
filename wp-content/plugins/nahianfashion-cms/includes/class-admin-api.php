<?php
defined('ABSPATH') || exit;

/**
 * REST API behind the admin panel (namespace nf/v1). Mirrors the JSON contract of the original
 * /api/admin/* routes so the admin UI works unchanged. Everything here requires manage_woocommerce
 * (cookie + X-WP-Nonce) except the public GETs of pages / footer / home-config.
 */
class NF_Admin_API {
    public static function init(): void {
        add_action('rest_api_init', [__CLASS__, 'routes']);
    }

    private static function reg(string $path, array $handlers, $perm = null): void {
        $perm = $perm ?: ['NF_REST', 'can_manage'];
        $defs = [];
        foreach ($handlers as $method => $cb) {
            $public = is_array($cb) && isset($cb['public']);
            $defs[] = ['methods' => $method, 'callback' => $public ? $cb['public'] : [__CLASS__, $cb], 'permission_callback' => $public ? '__return_true' : $perm];
        }
        register_rest_route('nf/v1', $path, $defs);
    }

    public static function can_super(): bool {
        return current_user_can('manage_options');
    }

    public static function routes(): void {
        self::reg('/admin/session', ['GET' => 'session']);
        self::reg('/admin/logo-version', ['GET' => 'logo_version']);
        self::reg('/admin/stats', ['GET' => 'stats']);
        self::reg('/admin/orders', ['GET' => 'orders_get', 'PUT' => 'orders_put', 'DELETE' => 'orders_delete']);
        self::reg('/admin/products', ['GET' => 'products_get', 'POST' => 'products_post', 'PUT' => 'products_put', 'DELETE' => 'products_delete']);
        self::reg('/admin/categories', ['GET' => 'categories_get', 'POST' => 'categories_post', 'PUT' => 'categories_put', 'DELETE' => 'categories_delete']);
        self::reg('/admin/coupons', ['GET' => 'coupons_get', 'POST' => 'coupons_post', 'PUT' => 'coupons_put', 'DELETE' => 'coupons_delete']);
        self::reg('/admin/combo-offers', ['GET' => 'combo_get', 'POST' => 'combo_post', 'PUT' => 'combo_put', 'DELETE' => 'combo_delete']);
        self::reg('/admin/testimonials', ['GET' => 'testi_get', 'POST' => 'testi_post', 'PUT' => 'testi_put', 'DELETE' => 'testi_delete']);
        self::reg('/admin/reviews', ['GET' => 'reviews_get']);
        self::reg('/admin/blocked', ['GET' => 'blocked_get', 'POST' => 'blocked_post', 'DELETE' => 'blocked_delete']);
        self::reg('/admin/settings', ['GET' => 'settings_get', 'PUT' => 'settings_put']);
        self::reg('/admin/logo', ['POST' => 'logo_post']);
        self::reg('/admin/users', ['GET' => 'users_get', 'PUT' => 'users_put']);
        self::reg('/admin/customers', ['GET' => 'customers_get']);
        self::reg('/admin/upload', ['POST' => 'upload_post', 'DELETE' => 'upload_delete']);
        self::reg('/admin/blog-upload', ['GET' => 'blog_get', 'POST' => 'blog_post', 'DELETE' => 'blog_delete']);
        self::reg('/public/pages', ['GET' => ['public' => [__CLASS__, 'pages_get']], 'POST' => 'pages_post', 'DELETE' => 'pages_delete']);
        self::reg('/public/footer', ['GET' => ['public' => [__CLASS__, 'footer_get']], 'POST' => 'footer_post']);
        self::reg('/public/home-config', ['GET' => ['public' => [__CLASS__, 'home_get']], 'POST' => 'home_post']);
        // admin-only verbs of the (public POST) reviews route
        register_rest_route('nf/v1', '/reviews', [
            ['methods' => 'DELETE', 'callback' => [__CLASS__, 'review_delete'], 'permission_callback' => ['NF_REST', 'can_manage']],
            ['methods' => 'PATCH', 'callback' => [__CLASS__, 'review_patch'], 'permission_callback' => ['NF_REST', 'can_manage']],
        ]);
    }

    /* ───────────────────────── helpers ───────────────────────── */

    private static function ok($data = null, int $status = 200, array $extra = []): WP_REST_Response {
        return new WP_REST_Response(array_merge(['data' => $data], $extra), $status);
    }

    private static function err(string $m, int $status = 400): WP_REST_Response {
        return new WP_REST_Response(['error' => $m], $status);
    }

    private static function body(WP_REST_Request $r): array {
        return $r->get_json_params() ?: [];
    }

    private static function iso(?string $mysql_utc): ?string {
        return $mysql_utc ? gmdate('c', strtotime($mysql_utc . ' UTC')) : null;
    }

    private static function bool($v): bool {
        return $v === true || $v === 1 || $v === '1' || $v === 'true' || $v === 't';
    }

    private static function url_to_id(?string $url): int {
        return NF_Products::attachment_for_url($url);
    }

    private static function id_to_url(int $id): ?string {
        $u = $id ? wp_get_attachment_url($id) : '';
        return $u ?: null;
    }

    private static function drop_attachment(int $id): void {
        if ($id && get_post_type($id) === 'attachment') {
            wp_delete_attachment($id, true);
        }
    }

    /* ───────────────────────── session / dashboard ───────────────────────── */

    public static function session(): WP_REST_Response {
        $u = wp_get_current_user();
        return new WP_REST_Response(['user' => ['id' => (string) $u->ID, 'name' => $u->display_name, 'email' => $u->user_email, 'role' => NF_Admin::role_label($u)]]);
    }

    public static function logo_version(): WP_REST_Response {
        return new WP_REST_Response(['v' => (int) get_option('nf_logo_version', 1)]);
    }

    public static function stats(): WP_REST_Response {
        $counts = wp_count_posts('product');
        $cats = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false, 'exclude' => [(int) get_option('default_product_cat')]]);
        $by = [];
        $revenue = 0.0;
        foreach (wc_get_orders(['limit' => -1, 'status' => 'any', 'return' => 'objects']) as $o) {
            $s = NF_Orders::from_wc_status($o->get_status());
            $by[$s] = ($by[$s] ?? 0) + 1;
            if ($s === 'delivered') {
                $revenue += (float) $o->get_total();
            }
        }
        $total = array_sum($by);
        return self::ok([
            'productsCount' => (int) ($counts->publish ?? 0),
            'categoriesCount' => is_wp_error($cats) ? 0 : count($cats),
            'orderSuccessCount' => $by['delivered'] ?? 0,
            'orderPendingCount' => $total - ($by['delivered'] ?? 0) - ($by['cancelled'] ?? 0) - ($by['returned'] ?? 0),
            'returnedOrdersCount' => $by['returned'] ?? 0,
            'totalRevenue' => $revenue,
        ]);
    }

    /* ───────────────────────── orders ───────────────────────── */

    private static function order_row(WC_Order $o): array {
        $a = NF_Orders::to_array($o);
        $items = [];
        foreach ($o->get_items() as $it) {
            $items[] = [
                'id' => (string) $it->get_id(), 'order_id' => $a['order_id'], 'product_id' => (string) $it->get_meta('_nf_product_id'),
                'product_name' => $it->get_name(), 'price' => (float) $it->get_meta('_nf_unit_price'), 'quantity' => (int) $it->get_quantity(),
                'image_url' => $it->get_meta('_nf_image_url') ?: null, 'size' => $it->get_meta('_nf_size') ?: null, 'color' => $it->get_meta('_nf_color') ?: null,
            ];
        }
        $a['id'] = (string) $o->get_id();
        $a['capi_sent'] = (bool) $o->get_meta('_nf_capi_sent');
        $a['draft_session_id'] = $o->get_meta('_nf_draft_session_id') ?: null;
        $a['items'] = $items;
        return $a;
    }

    public static function orders_get(): WP_REST_Response {
        $orders = wc_get_orders(['limit' => -1, 'orderby' => 'date', 'order' => 'DESC', 'status' => 'any', 'return' => 'objects']);
        $key = static function (string $phone): string {
            $c = preg_replace('/\D/', '', $phone);
            return strlen($c) >= 10 ? substr($c, -10) : $c;
        };
        $rows = array_map([__CLASS__, 'order_row'], $orders);
        $stats = [];
        foreach ($rows as $r) {
            if ($r['status'] === 'incomplete') { continue; }
            $k = $key($r['phone']);
            if ($k === '') { continue; }
            $c = $stats[$k] ?? ['total' => 0, 'success' => 0, 'cancel' => 0];
            $c['total']++;
            if ($r['status'] === 'delivered') { $c['success']++; }
            elseif (in_array($r['status'], ['returned', 'cancelled'], true)) { $c['cancel']++; }
            $stats[$k] = $c;
        }
        $out = [];
        foreach ($rows as $r) {
            $k = $key($r['phone']);
            if ($r['status'] === 'incomplete' && $r['phone'] && $r['phone'] !== '—' && $k !== '' && isset($stats[$k])) {
                continue; // draft of a customer who completed checkout later
            }
            $c = $stats[$k] ?? ['total' => 0, 'success' => 0, 'cancel' => 0];
            if ($r['status'] !== 'incomplete') {
                $c['total'] = max(0, $c['total'] - 1);
                if ($r['status'] === 'delivered') { $c['success'] = max(0, $c['success'] - 1); }
                elseif (in_array($r['status'], ['returned', 'cancelled'], true)) { $c['cancel'] = max(0, $c['cancel'] - 1); }
            }
            $r['local_stats'] = $c;
            $out[] = $r;
        }
        return self::ok($out);
    }

    public static function orders_put(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $o = wc_get_order((int) ($b['id'] ?? 0));
        if (!$o) { return self::err('Order not found', 404); }
        if (isset($b['status'])) {
            if (!isset(NF_Orders::STATUSES[$b['status']])) { return self::err('Invalid status'); }
            $o->set_status(NF_Orders::wc_status($b['status']));
        }
        foreach (['customer_name' => '_nf_customer_name', 'phone' => '_nf_phone', 'address' => '_nf_address', 'consignment_id' => '_nf_consignment_id'] as $k => $meta) {
            if (array_key_exists($k, $b)) { $o->update_meta_data($meta, (string) $b[$k]); }
        }
        if (isset($b['customer_name'])) { $o->set_billing_first_name((string) $b['customer_name']); }
        if (isset($b['phone'])) { $o->set_billing_phone((string) $b['phone']); }
        if (isset($b['address'])) { $o->set_billing_address_1((string) $b['address']); }
        foreach (['subtotal', 'shipping', 'discount', 'amount_paid'] as $k) {
            if (isset($b[$k])) { $o->update_meta_data('_nf_' . $k, (float) $b[$k]); }
        }
        if (isset($b['shipping'])) { $o->set_shipping_total((float) $b['shipping']); }
        if (isset($b['discount'])) { $o->set_discount_total((float) $b['discount']); }
        if (isset($b['total'])) { $o->set_total((float) $b['total']); }
        if (isset($b['items']) && is_array($b['items'])) {
            foreach ($b['items'] as $row) {
                $it = $o->get_item((int) ($row['id'] ?? 0));
                if (!$it instanceof WC_Order_Item_Product) { continue; }
                if (array_key_exists('size', $row)) {
                    if ($row['size']) { $it->update_meta_data('_nf_size', (string) $row['size']); } else { $it->delete_meta_data('_nf_size'); }
                }
                $qty = isset($row['quantity']) ? max(1, (int) $row['quantity']) : $it->get_quantity();
                $price = isset($row['price']) ? (float) $row['price'] : (float) $it->get_meta('_nf_unit_price');
                $it->set_quantity($qty);
                $it->update_meta_data('_nf_unit_price', (string) $price);
                $it->set_subtotal($price * $qty);
                $it->set_total($price * $qty);
                $it->save();
            }
        }
        $o->save();
        return self::ok(self::order_row(wc_get_order($o->get_id())));
    }

    public static function orders_delete(WP_REST_Request $req): WP_REST_Response {
        $o = wc_get_order((int) (self::body($req)['id'] ?? 0));
        if (!$o) { return self::err('Order not found', 404); }
        $o->delete(true);
        return new WP_REST_Response(['success' => true]);
    }

    /* ───────────────────────── products ───────────────────────── */

    public static function products_get(): WP_REST_Response {
        $q = new WP_Query(['post_type' => 'product', 'post_status' => 'any', 'posts_per_page' => -1, 'orderby' => ['menu_order' => 'ASC', 'date' => 'DESC'], 'no_found_rows' => true]);
        return self::ok(array_map(['NF_Products', 'to_row'], $q->posts));
    }

    public static function products_post(WP_REST_Request $req): WP_REST_Response {
        try {
            $id = NF_Products::save(self::body($req));
            return self::ok(NF_Products::to_row(get_post($id)), 201);
        } catch (Throwable $e) {
            return self::err($e->getMessage(), 500);
        }
    }

    public static function products_put(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $id = (int) ($b['id'] ?? 0);
        unset($b['id']);
        if (get_post_type($id) !== 'product') { return self::err('Product not found', 404); }
        try {
            NF_Products::save($b, $id);
            return self::ok(NF_Products::to_row(get_post($id)));
        } catch (Throwable $e) {
            return self::err($e->getMessage(), 500);
        }
    }

    public static function products_delete(WP_REST_Request $req): WP_REST_Response {
        $id = (int) (self::body($req)['id'] ?? 0);
        if (get_post_type($id) !== 'product') { return self::err('Product not found', 404); }
        NF_Products::delete($id);
        return new WP_REST_Response(['success' => true]);
    }

    /* ───────────────────────── categories ───────────────────────── */

    private static function cat_row(WP_Term $t): array {
        $active = get_term_meta($t->term_id, 'nf_is_active', true);
        return [
            'id' => (string) $t->term_id, 'name' => $t->name, 'slug' => $t->slug,
            'image_url' => self::id_to_url((int) get_term_meta($t->term_id, 'thumbnail_id', true)),
            'is_active' => $active === '' ? true : (bool) (int) $active,
            'display_order' => (int) get_term_meta($t->term_id, 'nf_display_order', true),
            'created_at' => gmdate('c'),
            'show_in_header' => (bool) (int) get_term_meta($t->term_id, 'nf_show_in_header', true),
            'show_in_footer' => (bool) (int) get_term_meta($t->term_id, 'nf_show_in_footer', true),
        ];
    }

    private static function cat_apply(int $term_id, array $b): void {
        if (array_key_exists('is_active', $b)) { update_term_meta($term_id, 'nf_is_active', self::bool($b['is_active']) ? 1 : 0); }
        if (array_key_exists('display_order', $b)) { update_term_meta($term_id, 'nf_display_order', (int) $b['display_order']); }
        if (array_key_exists('show_in_header', $b)) { update_term_meta($term_id, 'nf_show_in_header', self::bool($b['show_in_header']) ? 1 : 0); }
        if (array_key_exists('show_in_footer', $b)) { update_term_meta($term_id, 'nf_show_in_footer', self::bool($b['show_in_footer']) ? 1 : 0); }
        if (array_key_exists('image_url', $b)) {
            $old = (int) get_term_meta($term_id, 'thumbnail_id', true);
            $new = self::url_to_id($b['image_url']);
            update_term_meta($term_id, 'thumbnail_id', $new);
            if ($old && $old !== $new) { self::drop_attachment($old); }
        }
    }

    public static function categories_get(): WP_REST_Response {
        $terms = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false, 'exclude' => [(int) get_option('default_product_cat')]]);
        $rows = array_map([__CLASS__, 'cat_row'], is_wp_error($terms) ? [] : $terms);
        usort($rows, static fn($a, $b) => $a['display_order'] <=> $b['display_order'] ?: (int) $a['id'] <=> (int) $b['id']);
        return self::ok($rows);
    }

    public static function categories_post(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $name = trim((string) ($b['name'] ?? ''));
        if ($name === '') { return self::err('Name is required'); }
        $args = !empty($b['slug']) ? ['slug' => sanitize_title($b['slug'])] : [];
        $r = wp_insert_term($name, 'product_cat', $args);
        if (is_wp_error($r)) { return self::err($r->get_error_message(), 500); }
        self::cat_apply((int) $r['term_id'], $b);
        update_term_meta((int) $r['term_id'], 'nf_legacy_id', wp_generate_uuid4());
        return self::ok(self::cat_row(get_term((int) $r['term_id'])), 201);
    }

    public static function categories_put(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $id = (int) ($b['id'] ?? 0);
        $t = get_term($id, 'product_cat');
        if (!$t || is_wp_error($t)) { return self::err('Category not found', 404); }
        $args = [];
        if (!empty($b['name'])) { $args['name'] = trim((string) $b['name']); }
        if (!empty($b['slug'])) { $args['slug'] = sanitize_title($b['slug']); }
        if ($args) {
            $r = wp_update_term($id, 'product_cat', $args);
            if (is_wp_error($r)) { return self::err($r->get_error_message(), 500); }
        }
        self::cat_apply($id, $b);
        return self::ok(self::cat_row(get_term($id, 'product_cat')));
    }

    public static function categories_delete(WP_REST_Request $req): WP_REST_Response {
        $id = (int) (self::body($req)['id'] ?? 0);
        $thumb = (int) get_term_meta($id, 'thumbnail_id', true);
        wp_delete_term($id, 'product_cat');
        self::drop_attachment($thumb);
        return new WP_REST_Response(['success' => true]);
    }

    /* ───────────────────────── coupons ───────────────────────── */

    private static function coupon_row(WP_Post $p): array {
        $exp = get_post_meta($p->ID, 'date_expires', true);
        $min = get_post_meta($p->ID, 'minimum_amount', true);
        return [
            'id' => (string) $p->ID, 'code' => $p->post_title,
            'type' => get_post_meta($p->ID, 'discount_type', true) === 'percent' ? 'percent' : 'fixed',
            'value' => (float) get_post_meta($p->ID, 'coupon_amount', true),
            'min_order' => $min !== '' ? (float) $min : null,
            'max_uses' => (int) get_post_meta($p->ID, 'usage_limit', true),
            'used_count' => (int) get_post_meta($p->ID, 'usage_count', true),
            'is_active' => $p->post_status === 'publish',
            'expires_at' => $exp ? gmdate('c', (int) $exp) : null,
            'created_at' => gmdate('c', strtotime($p->post_date_gmt . ' UTC')),
        ];
    }

    private static function coupon_apply(int $id, array $b): void {
        if (array_key_exists('type', $b)) { update_post_meta($id, 'discount_type', $b['type'] === 'percent' ? 'percent' : 'fixed_cart'); }
        if (array_key_exists('value', $b)) { update_post_meta($id, 'coupon_amount', (string) (float) $b['value']); }
        if (array_key_exists('min_order', $b)) { update_post_meta($id, 'minimum_amount', ($b['min_order'] === null || $b['min_order'] === '') ? '' : (string) (float) $b['min_order']); }
        if (array_key_exists('max_uses', $b)) { update_post_meta($id, 'usage_limit', (int) $b['max_uses']); }
        if (array_key_exists('used_count', $b)) { update_post_meta($id, 'usage_count', (int) $b['used_count']); }
        if (array_key_exists('expires_at', $b)) {
            $ts = $b['expires_at'] ? strtotime((string) $b['expires_at'] . (preg_match('/[zZ+]|\d{2}:\d{2}$/', (string) $b['expires_at']) ? '' : ' UTC')) : false;
            update_post_meta($id, 'date_expires', $ts ?: '');
        }
        if (array_key_exists('is_active', $b)) { wp_update_post(['ID' => $id, 'post_status' => self::bool($b['is_active']) ? 'publish' : 'draft']); }
    }

    public static function coupons_get(): WP_REST_Response {
        $q = new WP_Query(['post_type' => 'shop_coupon', 'post_status' => ['publish', 'draft', 'private'], 'posts_per_page' => -1, 'orderby' => 'date', 'order' => 'DESC', 'no_found_rows' => true]);
        return self::ok(array_map([__CLASS__, 'coupon_row'], $q->posts));
    }

    public static function coupons_post(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $code = strtoupper(trim((string) ($b['code'] ?? '')));
        if ($code === '') { return self::err('Coupon code is required'); }
        if (NF_Coupons::find($code)) { return self::err('Coupon code already exists'); }
        $id = wp_insert_post(['post_type' => 'shop_coupon', 'post_title' => $code, 'post_status' => 'publish']);
        if (is_wp_error($id)) { return self::err($id->get_error_message(), 500); }
        add_post_meta($id, 'usage_count', 0, true);
        self::coupon_apply($id, $b + ['type' => 'fixed', 'is_active' => true]);
        return self::ok(self::coupon_row(get_post($id)), 201);
    }

    public static function coupons_put(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $id = (int) ($b['id'] ?? 0);
        if (get_post_type($id) !== 'shop_coupon') { return self::err('Coupon not found', 404); }
        if (!empty($b['code'])) { wp_update_post(['ID' => $id, 'post_title' => strtoupper(trim((string) $b['code']))]); }
        self::coupon_apply($id, $b);
        return self::ok(self::coupon_row(get_post($id)));
    }

    public static function coupons_delete(WP_REST_Request $req): WP_REST_Response {
        $id = (int) (self::body($req)['id'] ?? 0);
        if (get_post_type($id) === 'shop_coupon') { wp_delete_post($id, true); }
        return new WP_REST_Response(['success' => true]);
    }

    /* ───────────────────────── combo offers & testimonials (custom tables) ───────────────────────── */

    private static function table_rows(string $table, string $order): array {
        global $wpdb;
        $t = NF_DB::table($table);
        $rows = $wpdb->get_results("SELECT * FROM $t ORDER BY $order", ARRAY_A);
        foreach ($rows as &$r) {
            $r['image_url'] = self::id_to_url((int) $r['image_id']);
            unset($r['image_id']);
            $r['created_at'] = self::iso($r['created_at']);
            if (isset($r['is_active'])) { $r['is_active'] = (bool) (int) $r['is_active']; }
            if (isset($r['display_order'])) { $r['display_order'] = (int) $r['display_order']; }
            if (isset($r['rating'])) { $r['rating'] = (int) $r['rating']; }
            foreach ($r as $k => $v) { if ($v === '') { $r[$k] = null; } }
        }
        return $rows;
    }

    private static function table_save(string $table, array $fields, array $b, ?string $id): array {
        global $wpdb;
        $t = NF_DB::table($table);
        $data = [];
        foreach ($fields as $f) {
            if (!array_key_exists($f, $b)) { continue; }
            if ($f === 'image_url') {
                $data['image_id'] = self::url_to_id($b[$f]);
            } elseif ($f === 'is_active') {
                $data[$f] = self::bool($b[$f]) ? 1 : 0;
            } elseif (in_array($f, ['display_order', 'rating'], true)) {
                $data[$f] = (int) $b[$f];
            } else {
                $data[$f] = $b[$f] === null ? null : (string) $b[$f];
            }
        }
        if ($id === null) {
            $id = wp_generate_uuid4();
            $wpdb->insert($t, $data + ['id' => $id, 'created_at' => gmdate('Y-m-d H:i:s')]);
        } else {
            $old = $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id = %s", $id), ARRAY_A);
            if (isset($data['image_id']) && $old && (int) $old['image_id'] && (int) $old['image_id'] !== $data['image_id']) { self::drop_attachment((int) $old['image_id']); }
            if ($data) { $wpdb->update($t, $data, ['id' => $id]); }
        }
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id = %s", $id), ARRAY_A);
        return $row ?: [];
    }

    private static function table_row_out(array $row): array {
        $row['image_url'] = self::id_to_url((int) ($row['image_id'] ?? 0));
        unset($row['image_id']);
        $row['created_at'] = self::iso($row['created_at'] ?? null);
        if (isset($row['is_active'])) { $row['is_active'] = (bool) (int) $row['is_active']; }
        foreach (['display_order', 'rating'] as $k) { if (isset($row[$k])) { $row[$k] = (int) $row[$k]; } }
        return $row;
    }

    private static function table_delete(string $table, string $id): void {
        global $wpdb;
        $t = NF_DB::table($table);
        $old = $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id = %s", $id), ARRAY_A);
        if ($old) {
            self::drop_attachment((int) $old['image_id']);
            $wpdb->delete($t, ['id' => $id]);
        }
    }

    private const COMBO_FIELDS = ['title', 'subtitle', 'price', 'original_price', 'image_url', 'video_url', 'badge', 'is_active', 'display_order'];
    private const TESTI_FIELDS = ['type', 'name', 'image_url', 'video_url', 'quote', 'title', 'rating', 'display_order'];

    public static function combo_get(): WP_REST_Response { return self::ok(self::table_rows('combo_offers', 'display_order ASC')); }
    public static function combo_post(WP_REST_Request $r): WP_REST_Response { return self::ok(self::table_row_out(self::table_save('combo_offers', self::COMBO_FIELDS, self::body($r) + ['is_active' => true], null)), 201); }
    public static function combo_put(WP_REST_Request $r): WP_REST_Response {
        $b = self::body($r);
        if (empty($b['id'])) { return self::err('ID required'); }
        return self::ok(self::table_row_out(self::table_save('combo_offers', self::COMBO_FIELDS, $b, (string) $b['id'])));
    }
    public static function combo_delete(WP_REST_Request $r): WP_REST_Response {
        $id = (string) ($r->get_param('id') ?: '');
        if ($id === '') { return self::err('ID required'); }
        self::table_delete('combo_offers', $id);
        return new WP_REST_Response(['success' => true]);
    }

    public static function testi_get(): WP_REST_Response { return self::ok(self::table_rows('testimonials', 'display_order ASC')); }
    public static function testi_post(WP_REST_Request $r): WP_REST_Response { return self::ok(self::table_row_out(self::table_save('testimonials', self::TESTI_FIELDS, self::body($r) + ['type' => 'review', 'rating' => 5], null)), 201); }
    public static function testi_put(WP_REST_Request $r): WP_REST_Response {
        $b = self::body($r);
        if (empty($b['id'])) { return self::err('ID required'); }
        return self::ok(self::table_row_out(self::table_save('testimonials', self::TESTI_FIELDS, $b, (string) $b['id'])));
    }
    public static function testi_delete(WP_REST_Request $r): WP_REST_Response {
        self::table_delete('testimonials', (string) (self::body($r)['id'] ?? ''));
        return new WP_REST_Response(['success' => true]);
    }

    /* ───────────────────────── reviews ───────────────────────── */

    public static function reviews_get(): WP_REST_Response {
        $rows = [];
        foreach (get_comments(['type' => 'review', 'status' => 'all', 'orderby' => 'comment_date_gmt', 'order' => 'DESC']) as $c) {
            $rows[] = ['id' => (string) $c->comment_ID, 'product_id' => (string) $c->comment_post_ID, 'name' => $c->comment_author, 'rating' => (int) get_comment_meta($c->comment_ID, 'rating', true), 'comment' => $c->comment_content, 'created_at' => gmdate('c', strtotime($c->comment_date_gmt . ' UTC'))];
        }
        $names = [];
        foreach (get_posts(['post_type' => 'product', 'post_status' => 'any', 'posts_per_page' => -1]) as $p) { $names[(string) $p->ID] = $p->post_title; }
        return new WP_REST_Response(['data' => $rows, 'product_names' => $names]);
    }

    private static function review_touch(int $cid): void {
        $c = get_comment($cid);
        if ($c && class_exists('WC_Comments')) { WC_Comments::clear_transients((int) $c->comment_post_ID); }
    }

    public static function review_delete(WP_REST_Request $req): WP_REST_Response {
        $id = (int) (self::body($req)['reviewId'] ?? 0);
        if (!$id) { return self::err('reviewId is required'); }
        $c = get_comment($id);
        wp_delete_comment($id, true);
        if ($c && class_exists('WC_Comments')) { WC_Comments::clear_transients((int) $c->comment_post_ID); }
        return new WP_REST_Response(['success' => true]);
    }

    public static function review_patch(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $id = (int) ($b['reviewId'] ?? 0);
        if (!$id || !get_comment($id)) { return self::err('reviewId is required'); }
        $upd = ['comment_ID' => $id];
        if (isset($b['name'])) { $upd['comment_author'] = wp_strip_all_tags((string) $b['name']); }
        if (isset($b['comment'])) { $upd['comment_content'] = wp_strip_all_tags((string) $b['comment']); }
        wp_update_comment($upd);
        if (isset($b['rating'])) { update_comment_meta($id, 'rating', max(1, min(5, (int) $b['rating']))); }
        self::review_touch($id);
        return new WP_REST_Response(['success' => true]);
    }

    /* ───────────────────────── blocked list ───────────────────────── */

    public static function blocked_get(): WP_REST_Response {
        global $wpdb;
        $t = NF_DB::table('blocked_items');
        $rows = $wpdb->get_results("SELECT * FROM $t ORDER BY created_at DESC", ARRAY_A);
        foreach ($rows as &$r) { $r['created_at'] = self::iso($r['created_at']); }
        return new WP_REST_Response(['success' => true, 'data' => $rows]);
    }

    public static function blocked_post(WP_REST_Request $req): WP_REST_Response {
        global $wpdb;
        $b = self::body($req);
        $type = $b['type'] ?? '';
        $value = trim((string) ($b['value'] ?? ''));
        if (!$type || $value === '') { return self::err('Type and value are required.'); }
        if (!in_array($type, ['phone', 'ip'], true)) { return self::err('Invalid block type. Must be "phone" or "ip".'); }
        if ($type === 'phone') {
            $c = NF_Steadfast::normalize_phone($value);
            if (!$c) { return self::err('Invalid Bangladeshi phone number format.'); }
            $value = $c;
        }
        $t = NF_DB::table('blocked_items');
        if ($wpdb->get_var($wpdb->prepare("SELECT id FROM $t WHERE value = %s", $value))) { return self::err("This $type is already blocked."); }
        $row = ['id' => wp_generate_uuid4(), 'type' => $type, 'value' => $value, 'reason' => trim((string) ($b['reason'] ?? '')) ?: 'No reason specified', 'created_at' => gmdate('Y-m-d H:i:s')];
        $wpdb->insert($t, $row);
        $row['created_at'] = self::iso($row['created_at']);
        return new WP_REST_Response(['success' => true, 'data' => $row]);
    }

    public static function blocked_delete(WP_REST_Request $req): WP_REST_Response {
        global $wpdb;
        $id = (string) $req->get_param('id');
        if ($id === '') { return self::err('Item ID required.'); }
        $wpdb->delete(NF_DB::table('blocked_items'), ['id' => $id]);
        return new WP_REST_Response(['success' => true]);
    }

    /* ───────────────────────── settings / logo ───────────────────────── */

    private const SETTING_FIELDS = ['site_name', 'site_tagline', 'meta_description', 'contact_email', 'whatsapp_number', 'phone_number', 'instagram_url', 'facebook_url', 'currency_code', 'currency_symbol', 'footer_social_heading'];

    public static function settings_get(): WP_REST_Response {
        $s = get_option('nf_site_settings', []);
        return self::ok(['id' => 1] + array_intersect_key((array) $s, array_flip(self::SETTING_FIELDS)));
    }

    public static function settings_put(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $cur = (array) get_option('nf_site_settings', []);
        foreach (self::SETTING_FIELDS as $f) {
            if (array_key_exists($f, $b)) { $cur[$f] = $b[$f] === null ? null : sanitize_text_field((string) $b[$f]); }
        }
        update_option('nf_site_settings', $cur, false);
        return self::ok(['id' => 1] + array_intersect_key($cur, array_flip(self::SETTING_FIELDS)));
    }

    public static function logo_post(): WP_REST_Response {
        $f = $_FILES['file'] ?? null;
        if (!$f || empty($f['tmp_name'])) { return self::err('No file received.'); }
        if (strpos((string) $f['type'], 'image/') !== 0) { return self::err('Only image files are allowed.'); }
        if ($f['size'] > 20 * 1024 * 1024) { return self::err('ইমেজ সাইজ অনেক বড় (' . round($f['size'] / 1048576, 1) . 'MB)। সর্বোচ্চ ২০MB পর্যন্ত আপলোড করা যাবে। সাইজ কমিয়ে আবার চেষ্টা করুন।'); }
        $id = self::handle_upload('file');
        if (is_wp_error($id)) { return self::err($id->get_error_message(), 500); }
        $old = (int) get_option('nf_logo_id', 0);
        update_option('nf_logo_id', $id);
        $v = (int) round(microtime(true) * 1000);
        update_option('nf_logo_version', $v);
        if ($old && $old !== $id) { self::drop_attachment($old); }
        return new WP_REST_Response(['success' => true, 'v' => $v]);
    }

    /* ───────────────────────── admin users (WordPress roles) ───────────────────────── */

    private static function user_role(WP_User $u): string {
        if (in_array('administrator', (array) $u->roles, true)) { return 'super_admin'; }
        if (in_array('shop_manager', (array) $u->roles, true)) { return 'admin'; }
        return 'customer';
    }

    private static function user_row(WP_User $u): array {
        return ['id' => (string) $u->ID, 'name' => $u->display_name, 'email' => $u->user_email, 'role' => self::user_role($u), 'created_at' => gmdate('c', strtotime($u->user_registered . ' UTC'))];
    }

    public static function users_get(): WP_REST_Response {
        $users = get_users(['role__in' => ['administrator', 'shop_manager'], 'orderby' => 'registered', 'order' => 'ASC']);
        return self::ok(array_map([__CLASS__, 'user_row'], $users));
    }

    public static function users_put(WP_REST_Request $req): WP_REST_Response {
        if (!self::can_super()) { return self::err('Unauthorized', 401); }
        $b = self::body($req);
        $map = ['admin' => 'shop_manager', 'super_admin' => 'administrator', 'customer' => 'subscriber'];
        if (!isset($map[$b['role'] ?? ''])) { return self::err('Invalid role'); }
        $u = get_userdata((int) ($b['userId'] ?? 0));
        if (!$u) { return self::err('User not found', 404); }
        if (self::user_role($u) === 'super_admin' && $b['role'] !== 'super_admin' && count(get_users(['role' => 'administrator', 'fields' => 'ID'])) <= 1) {
            return self::err('At least one super admin is required.');
        }
        $u->set_role($map[$b['role']]);
        return new WP_REST_Response(['success' => true]);
    }

    public static function customers_get(WP_REST_Request $req): WP_REST_Response {
        $email = (string) $req->get_param('email');
        $u = $email ? get_user_by('email', $email) : false;
        return self::ok($u ? self::user_row($u) : null);
    }

    /* ───────────────────────── uploads (media library) ───────────────────────── */

    private static function handle_upload(string $field, int $parent = 0) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        return media_handle_upload($field, $parent, [], ['test_form' => false]);
    }

    public static function upload_post(): WP_REST_Response {
        $f = $_FILES['file'] ?? null;
        if (!$f || empty($f['tmp_name'])) { return self::err('No file received.'); }
        $ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
        if (!in_array($f['type'], $ok, true)) { return self::err('Invalid file type: "' . $f['type'] . '". Only JPEG, PNG, WebP, GIF, MP4, and WEBM are allowed.'); }
        $video = strpos($f['type'], 'video/') === 0;
        $max = $video ? 200 * 1048576 : 20 * 1048576;
        if ($f['size'] > $max) {
            $mb = round($f['size'] / 1048576, 1);
            return self::err('ফাইল সাইজ অনেক বড়: ' . $mb . 'MB। ' . ($video ? 'ভিডিও' : 'ইমেজ') . ' ফাইলের সর্বোচ্চ সাইজ ' . ($video ? '200MB' : '20MB') . '। সাইজ কমিয়ে আবার আপলোড করুন।');
        }
        $id = self::handle_upload('file');
        if (is_wp_error($id)) { return self::err('Failed to upload file.', 500); }
        return new WP_REST_Response(['url' => wp_get_attachment_url($id)], 201);
    }

    public static function upload_delete(WP_REST_Request $req): WP_REST_Response {
        $url = (string) (self::body($req)['url'] ?? '');
        if ($url === '') { return self::err('No URL provided.'); }
        self::drop_attachment((int) attachment_url_to_postid($url));
        return new WP_REST_Response(['success' => true]);
    }

    public static function blog_get(): WP_REST_Response {
        $files = [];
        foreach (get_posts(['post_type' => 'attachment', 'post_status' => 'any', 'posts_per_page' => -1, 'meta_key' => '_nf_library', 'meta_value' => 'blog', 'orderby' => 'date', 'order' => 'DESC']) as $a) {
            $files[] = ['name' => basename((string) get_attached_file($a->ID)), 'url' => wp_get_attachment_url($a->ID)];
        }
        return new WP_REST_Response(['files' => $files]);
    }

    public static function blog_post(WP_REST_Request $req): WP_REST_Response {
        $f = $_FILES['file'] ?? null;
        $name = (string) ($req->get_param('name') ?? '');
        if (!$f || empty($f['tmp_name']) || $name === '') { return self::err('File and name are required'); }
        if (!in_array($f['type'], ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) { return self::err('Invalid file type: "' . $f['type'] . '". Only JPEG, PNG, WebP, and GIF are allowed.'); }
        if ($f['size'] > 20 * 1048576) { return self::err('ইমেজ সাইজ অনেক বড় (' . round($f['size'] / 1048576, 1) . 'MB)। সর্বোচ্চ ২০MB পর্যন্ত আপলোড করা যাবে। সাইজ কমিয়ে আবার চেষ্টা করুন।'); }
        $ext = strtolower(pathinfo((string) $f['name'], PATHINFO_EXTENSION));
        $clean = preg_replace('/\.{2,}/', '_', preg_replace('/[^a-zA-Z0-9.\-_]/', '_', $name));
        if ($clean === '') { return self::err('Invalid filename'); }
        if (strtolower(substr($clean, -strlen($ext) - 1)) !== '.' . $ext) { $clean .= '.' . $ext; }
        $_FILES['file']['name'] = $clean;
        $id = self::handle_upload('file');
        if (is_wp_error($id)) { return self::err('Internal server error', 500); }
        update_post_meta($id, '_nf_library', 'blog');
        return new WP_REST_Response(['url' => wp_get_attachment_url($id), 'name' => basename((string) get_attached_file($id))]);
    }

    public static function blog_delete(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $id = !empty($b['url']) ? (int) attachment_url_to_postid((string) $b['url']) : 0;
        if (!$id && !empty($b['name'])) {
            foreach (get_posts(['post_type' => 'attachment', 'post_status' => 'any', 'posts_per_page' => -1, 'meta_key' => '_nf_library', 'meta_value' => 'blog']) as $a) {
                if (basename((string) get_attached_file($a->ID)) === $b['name']) { $id = $a->ID; break; }
            }
        }
        if (!$id) { return self::err('No URL provided.'); }
        self::drop_attachment($id);
        return new WP_REST_Response(['success' => true]);
    }

    /* ───────────────────────── pages (support articles) ───────────────────────── */

    private static function page_row(WP_Post $p): array {
        $hid = (int) get_post_meta($p->ID, 'nf_header_image_id', true);
        return [
            'id' => (string) $p->ID, 'slug' => $p->post_name, 'title' => $p->post_title, 'section' => (string) get_post_meta($p->ID, 'nf_section', true),
            'content' => $p->post_content, 'is_published' => $p->post_status === 'publish', 'header_image' => self::id_to_url($hid),
            'created_at' => gmdate('c', strtotime($p->post_date_gmt . ' UTC')), 'updated_at' => gmdate('c', strtotime($p->post_modified_gmt . ' UTC')),
            'show_in_footer' => (bool) (int) get_post_meta($p->ID, 'nf_show_in_footer', true),
        ];
    }

    public static function pages_get(WP_REST_Request $req): WP_REST_Response {
        $slug = (string) $req->get_param('slug');
        if ($slug !== '') {
            $p = get_page_by_path($slug, OBJECT, 'page');
            if ($p && $p->post_status !== 'publish' && !current_user_can('manage_woocommerce')) {
                $p = null; // drafts are never public
            }
            return self::ok($p ? self::page_row($p) : null);
        }
        $args = ['post_type' => 'page', 'post_status' => ['publish', 'draft', 'private'], 'posts_per_page' => -1, 'orderby' => 'date', 'order' => 'DESC', 'meta_key' => 'nf_section'];
        if ($req->get_param('section')) { $args['meta_value'] = (string) $req->get_param('section'); }
        $rows = array_map([__CLASS__, 'page_row'], get_posts($args));
        if (!current_user_can('manage_woocommerce')) { $rows = array_values(array_filter($rows, static fn($r) => $r['is_published'])); }
        return self::ok($rows);
    }

    public static function pages_post(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $slug = sanitize_title((string) ($b['slug'] ?? ''));
        if ($slug === '') { return self::err('slug is required', 500); }
        $existing = get_page_by_path($slug, OBJECT, 'page');
        $post = ['post_type' => 'page', 'post_name' => $slug];
        if (isset($b['title'])) { $post['post_title'] = (string) $b['title']; }
        if (isset($b['content'])) { $post['post_content'] = (string) $b['content']; }
        if (array_key_exists('is_published', $b)) { $post['post_status'] = self::bool($b['is_published']) ? 'publish' : 'draft'; }
        if ($existing) { $post['ID'] = $existing->ID; $id = wp_update_post($post, true); }
        else { $post += ['post_status' => 'draft', 'post_title' => $slug]; $id = wp_insert_post($post, true); }
        if (is_wp_error($id)) { return self::err($id->get_error_message(), 500); }
        if (isset($b['section'])) { update_post_meta($id, 'nf_section', (string) $b['section']); }
        if (array_key_exists('show_in_footer', $b)) { update_post_meta($id, 'nf_show_in_footer', self::bool($b['show_in_footer']) ? 1 : 0); }
        if (array_key_exists('header_image', $b)) { update_post_meta($id, 'nf_header_image_id', self::url_to_id($b['header_image'])); }
        return new WP_REST_Response(['success' => true, 'data' => self::page_row(get_post($id))]);
    }

    public static function pages_delete(WP_REST_Request $req): WP_REST_Response {
        $p = get_page_by_path((string) (self::body($req)['slug'] ?? ''), OBJECT, 'page');
        if (!$p) { return self::err('Page not found', 500); }
        wp_delete_post($p->ID, true);
        return new WP_REST_Response(['success' => true]);
    }

    /* ───────────────────────── footer / home config ───────────────────────── */

    public static function footer_get(): WP_REST_Response {
        $c = get_option('nf_footer_config', null);
        return self::ok(is_array($c) ? ['id' => 1, 'columns' => $c['columns'] ?? [], 'privacy' => $c['privacy'] ?? null, 'terms' => $c['terms'] ?? null, 'newsletter' => $c['newsletter'] ?? null, 'social' => $c['social'] ?? null, 'ticker' => $c['ticker'] ?? null] : null);
    }

    public static function footer_post(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        unset($b['id']);
        $cur = (array) get_option('nf_footer_config', []);
        foreach (['columns', 'privacy', 'terms', 'newsletter', 'social', 'ticker'] as $k) {
            if (array_key_exists($k, $b)) { $cur[$k] = $b[$k]; }
        }
        update_option('nf_footer_config', $cur, false);
        return new WP_REST_Response(['success' => true, 'data' => ['id' => 1] + $cur]);
    }

    private static function home_out(array $c): array {
        $banners = [];
        foreach ((array) ($c['banners'] ?? []) as $b) {
            $banners[] = ['id' => (string) ($b['id'] ?? ''), 'image_url' => self::id_to_url((int) ($b['image_id'] ?? 0)) ?: '', 'link' => $b['link'] ?? ''];
        }
        return ['id' => 1, 'banners' => $banners, 'ticker_items' => $c['ticker_items'] ?? [], 'data' => $c['data'] ?? (object) [], 'updated_at' => gmdate('c')];
    }

    public static function home_get(): WP_REST_Response {
        $c = get_option('nf_home_config', null);
        return self::ok(is_array($c) ? self::home_out($c) : null);
    }

    public static function home_post(WP_REST_Request $req): WP_REST_Response {
        $b = self::body($req);
        $cur = (array) get_option('nf_home_config', []);
        if (array_key_exists('banners', $b)) {
            $old_ids = array_map(static fn($x) => (int) ($x['image_id'] ?? 0), (array) ($cur['banners'] ?? []));
            $new = [];
            foreach ((array) $b['banners'] as $x) {
                $new[] = ['id' => (string) ($x['id'] ?? wp_generate_uuid4()), 'image_id' => self::url_to_id($x['image_url'] ?? ''), 'link' => (string) ($x['link'] ?? '')];
            }
            $cur['banners'] = $new;
            foreach (array_diff($old_ids, array_column($new, 'image_id')) as $gone) { self::drop_attachment((int) $gone); }
        }
        if (array_key_exists('ticker_items', $b)) { $cur['ticker_items'] = $b['ticker_items']; }
        if (array_key_exists('data', $b)) { $cur['data'] = $b['data']; }
        update_option('nf_home_config', $cur, false);
        return new WP_REST_Response(['success' => true, 'data' => self::home_out($cur)]);
    }
}
