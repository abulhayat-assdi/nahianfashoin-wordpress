<?php
defined('ABSPATH') || exit;

/**
 * Orders are WooCommerce orders (HPOS compatible) with the storefront's own status set.
 * Order ids shown to customers: "NF-<32 hex>" (placed) and "DRAFT-<16 hex>" (abandoned-checkout drafts).
 */
class NF_Orders {
    /** original status => label */
    const STATUSES = [
        'pending'        => 'Pending',
        'received'       => 'Received',
        'preparing'      => 'Preparing',
        'on_way'         => 'On the way',
        'delivered'      => 'Delivered',
        'cancelled'      => 'Cancelled',
        'payment_failed' => 'Payment failed',
        'returned'       => 'Returned',
        'incomplete'     => 'Incomplete',
    ];

    public static function init(): void {
        add_action('init', [__CLASS__, 'register_statuses']);
        add_filter('wc_order_statuses', [__CLASS__, 'order_statuses']);
        add_action('before_woocommerce_init', static function () {
            if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
                \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', NF_CMS_FILE, true);
            }
        });
    }

    public static function wc_status(string $status): string {
        return 'nf-' . $status;
    }

    public static function from_wc_status(string $wc): string {
        $wc = preg_replace('/^wc-/', '', $wc);
        if (strpos($wc, 'nf-') === 0) {
            return substr($wc, 3);
        }
        // Statuses created by WooCommerce itself (e.g. imported or manual orders) map onto the closest storefront status.
        return ['processing' => 'received', 'completed' => 'delivered', 'on-hold' => 'pending', 'refunded' => 'returned', 'failed' => 'payment_failed', 'pending' => 'pending', 'cancelled' => 'cancelled'][$wc] ?? 'pending';
    }

    public static function register_statuses(): void {
        foreach (self::STATUSES as $key => $label) {
            register_post_status('wc-' . self::wc_status($key), [
                'label'                     => $label,
                'public'                    => false,
                'exclude_from_search'       => false,
                'show_in_admin_all_list'    => true,
                'show_in_admin_status_list' => true,
                'label_count'               => _n_noop($label . ' <span class="count">(%s)</span>', $label . ' <span class="count">(%s)</span>'),
            ]);
        }
    }

    public static function order_statuses(array $s): array {
        foreach (self::STATUSES as $key => $label) {
            $s['wc-' . self::wc_status($key)] = $label;
        }
        return $s;
    }

    /* ───────────────────────── helpers ───────────────────────── */

    public static function normalize_phone(string $raw): string {
        $num = preg_replace('/[\s\-()]/', '', $raw);
        if (strpos($num, '+880') === 0) {
            $num = '0' . substr($num, 4);
        } elseif (strpos($num, '880') === 0) {
            $num = '0' . substr($num, 3);
        }
        return $num;
    }

    public static function parse_price($v): float {
        $stripped = preg_replace('/[^0-9.]/', '', (string) $v);
        $parts = explode('.', (string) $stripped);
        $cleaned = count($parts) > 1 ? implode('', array_slice($parts, 0, -1)) . '.' . end($parts) : $stripped;
        return is_numeric($cleaned) ? (float) $cleaned : 0.0;
    }

    public static function is_blocked(string $phone, string $ip): bool {
        global $wpdb;
        $t = NF_DB::table('blocked_items');
        $digits = preg_replace('/\D/', '', $phone);
        $match = strlen($digits) >= 10 ? substr($digits, -10) : $digits;
        if ($match !== '' && strlen($digits) >= 10) {
            $hit = $wpdb->get_var($wpdb->prepare("SELECT id FROM $t WHERE type = 'phone' AND value LIKE %s LIMIT 1", '%' . $wpdb->esc_like($match)));
            if ($hit) {
                return true;
            }
        }
        if ($ip !== 'unknown') {
            return (bool) $wpdb->get_var($wpdb->prepare("SELECT id FROM $t WHERE type = 'ip' AND value = %s LIMIT 1", $ip));
        }
        return false;
    }

    public static function find_by_public_id(string $public_id): ?WC_Order {
        $orders = wc_get_orders(['limit' => 1, 'meta_key' => '_nf_order_id', 'meta_value' => $public_id, 'status' => 'any', 'return' => 'objects']);
        return $orders ? $orders[0] : null;
    }

    /** Order in the original storefront JSON shape (snake_case, items with category). */
    public static function to_array(WC_Order $o): array {
        $items = [];
        foreach ($o->get_items() as $it) {
            $pid = (string) $it->get_meta('_nf_product_id');
            $cat = null;
            if (ctype_digit($pid) && get_post_type((int) $pid) === 'product') {
                $terms = get_the_terms((int) $pid, 'product_cat');
                if ($terms && !is_wp_error($terms)) {
                    $cat = trim($terms[0]->name);
                }
            }
            $items[] = [
                'product_id'   => $pid,
                'product_name' => $it->get_name(),
                'price'        => (string) $it->get_meta('_nf_unit_price'),
                'quantity'     => (int) $it->get_quantity(),
                'image_url'    => $it->get_meta('_nf_image_url') ?: null,
                'size'         => $it->get_meta('_nf_size') ?: null,
                'color'        => $it->get_meta('_nf_color') ?: null,
                'category'     => $cat,
            ];
        }
        $date = $o->get_date_created();
        return [
            'order_id'       => (string) $o->get_meta('_nf_order_id'),
            'user_id'        => $o->get_customer_id() ?: null,
            'customer_name'  => (string) $o->get_meta('_nf_customer_name'),
            'phone'          => (string) $o->get_meta('_nf_phone'),
            'address'        => (string) $o->get_meta('_nf_address'),
            'subtotal'       => (float) $o->get_meta('_nf_subtotal'),
            'shipping'       => (float) $o->get_meta('_nf_shipping'),
            'discount'       => (float) $o->get_meta('_nf_discount'),
            'total'          => (float) $o->get_total(),
            'payment_method' => (string) ($o->get_meta('_nf_payment_method') ?: 'cash'),
            'amount_paid'    => (float) $o->get_meta('_nf_amount_paid'),
            'status'         => self::from_wc_status($o->get_status()),
            'consignment_id' => $o->get_meta('_nf_consignment_id') ?: null,
            'ip_address'     => $o->get_meta('_nf_ip') ?: null,
            'placed_at'      => $date ? gmdate('c', $date->getTimestamp()) : null,
            'items'          => $items,
        ];
    }

    /**
     * Builds the WooCommerce order. $lines: [['product_id','name','price'(float),'quantity','image','size','color'] ...]
     */
    private static function build_order(string $public_id, string $status, array $data, array $lines, float $subtotal, float $shipping, float $discount, ?string $coupon_code): WC_Order {
        $order = wc_create_order(['status' => self::wc_status($status), 'customer_id' => 0]);
        foreach ($lines as $l) {
            $item = new WC_Order_Item_Product();
            $product = ctype_digit((string) $l['product_id']) ? wc_get_product((int) $l['product_id']) : null;
            if ($product) {
                $item->set_product($product);
            }
            $item->set_name($l['name']);
            $item->set_quantity($l['quantity']);
            $item->set_subtotal($l['price'] * $l['quantity']);
            $item->set_total($l['price'] * $l['quantity']);
            $item->add_meta_data('_nf_product_id', (string) $l['product_id']);
            $item->add_meta_data('_nf_unit_price', (string) $l['price']);
            $item->add_meta_data('_nf_image_url', (string) ($l['image'] ?? ''));
            if (!empty($l['size'])) {
                $item->add_meta_data('_nf_size', (string) $l['size']);
            }
            if (!empty($l['color'])) {
                $item->add_meta_data('_nf_color', (string) $l['color']);
            }
            $order->add_item($item);
        }
        $ship = new WC_Order_Item_Shipping();
        $ship->set_method_title('Delivery');
        $ship->set_total($shipping);
        $order->add_item($ship);
        if ($coupon_code) {
            $ci = new WC_Order_Item_Coupon();
            $ci->set_code($coupon_code);
            $ci->set_discount($discount);
            $order->add_item($ci);
        }
        $order->set_billing_first_name($data['name']);
        $order->set_billing_phone($data['phone']);
        $order->set_billing_address_1($data['address']);
        $order->set_billing_country('BD');
        $order->set_payment_method('cod');
        $order->set_payment_method_title('Cash on Delivery');
        $order->set_discount_total($discount);
        $order->set_shipping_total($shipping);
        $order->set_total($subtotal - $discount + $shipping);
        $order->update_meta_data('_nf_order_id', $public_id);
        $order->update_meta_data('_nf_customer_name', $data['name']);
        $order->update_meta_data('_nf_phone', $data['phone']);
        $order->update_meta_data('_nf_address', $data['address']);
        $order->update_meta_data('_nf_subtotal', $subtotal);
        $order->update_meta_data('_nf_shipping', $shipping);
        $order->update_meta_data('_nf_discount', $discount);
        $order->update_meta_data('_nf_payment_method', 'cash');
        $order->update_meta_data('_nf_amount_paid', 0);
        $order->update_meta_data('_nf_ip', $data['ip']);
        if (!empty($data['draft_session'])) {
            $order->update_meta_data('_nf_draft_session_id', $data['draft_session']);
        }
        $order->save();
        return $order;
    }

    /* ───────────────────────── create ───────────────────────── */

    public static function create(WP_REST_Request $req): WP_REST_Response {
        $err = static fn(string $m, int $c = 400) => new WP_REST_Response(['error' => $m], $c);
        $ip = NF_REST::client_ip();
        $b = $req->get_json_params() ?: [];
        $name = isset($b['name']) ? trim((string) $b['name']) : '';
        $phone = (string) ($b['phone'] ?? '');
        $address = isset($b['address']) ? trim((string) $b['address']) : '';
        $items = $b['items'] ?? null;

        if ($name === '' || $phone === '' || $address === '' || !is_array($items) || !$items) {
            return $err('Missing required fields');
        }
        if (count($items) > 50) {
            return $err('Order cannot contain more than 50 items');
        }
        foreach ($items as $it) {
            if (empty($it['productId']) || !is_string($it['productId'])) {
                return $err('Invalid product ID in items');
            }
            $q = $it['quantity'] ?? null;
            if (!is_int($q) || $q < 1 || $q > 100) {
                return $err('Item quantity must be between 1 and 100');
            }
        }

        $norm = self::normalize_phone($phone);
        if (!preg_match('/^01[3-9][0-9]{8}$/', $norm)) {
            return $err('সঠিক মোবাইল নম্বর দিন — ১১ ডিজিটের বাংলাদেশি নম্বর (01XXXXXXXXX)।');
        }
        if (self::is_blocked($norm, $ip)) {
            return $err('দুঃখিত, আপনার মোবাইল নম্বর অথবা ডিভাইসটি সাময়িকভাবে ব্লক করা হয়েছে। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।', 403);
        }
        if (($b['paymentMethod'] ?? '') !== 'cash') {
            return $err('Invalid payment method');
        }
        if (!NF_REST::rate_limit('order:phone:' . $norm, 5, HOUR_IN_SECONDS)) {
            return $err('এই নম্বর থেকে অল্প সময়ে অনেকগুলো অর্ডার এসেছে। কিছুক্ষণ পর আবার চেষ্টা করুন।', 429);
        }
        if ($ip !== 'unknown' && !NF_REST::rate_limit('order:ip:' . $ip, 30, HOUR_IN_SECONDS)) {
            return $err('সার্ভার ব্যস্ত। কিছুক্ষণ পর আবার চেষ্টা করুন।', 429);
        }
        if ($ip !== 'unknown') {
            $recent = wc_get_orders([
                'limit' => 1, 'return' => 'ids', 'meta_key' => '_nf_ip', 'meta_value' => $ip,
                'date_created' => '>' . (time() - 12 * HOUR_IN_SECONDS),
                'status' => array_map(static fn($s) => 'wc-' . self::wc_status($s), array_values(array_diff(array_keys(self::STATUSES), ['incomplete']))),
            ]);
            if ($recent) {
                return $err('আপনার ডিভাইস থেকে ইতিমধ্যে একটি অর্ডার করা হয়েছে। ১২ ঘন্টা পর আবার অর্ডার করতে পারবেন।');
            }
        }

        $lines = [];
        $subtotal = 0.0;
        foreach ($items as $it) {
            $pid = (int) $it['productId'];
            $post = ctype_digit($it['productId']) ? get_post($pid) : null;
            if (!$post || $post->post_type !== 'product' || $post->post_status !== 'publish') {
                return $err($lines ? 'Product not found' : 'Failed to verify product prices');
            }
            if (get_post_meta($pid, '_stock_status', true) === 'outofstock') {
                return $err('"' . $post->post_title . '" এই মুহূর্তে স্টকে নেই। পণ্যটি বাদ দিয়ে আবার চেষ্টা করুন।');
            }
            $size = isset($it['size']) && $it['size'] !== '' ? (string) $it['size'] : null;
            if ($size) {
                $sizes = json_decode((string) get_post_meta($pid, '_nf_sizes', true), true) ?: [];
                foreach ($sizes as $s) {
                    if (($s['size'] ?? null) === $size && array_key_exists('available', $s) && $s['available'] === false) {
                        return $err('"' . $post->post_title . '" এর "' . $size . '" সাইজটি স্টকে নেই। অন্য সাইজ বেছে নিন।');
                    }
                }
            }
            $price = self::parse_price(get_post_meta($pid, '_nf_price', true) ?: get_post_meta($pid, '_price', true));
            $subtotal += $price * $it['quantity'];
            $ids = json_decode((string) get_post_meta($pid, '_nf_media_ids', true), true) ?: [];
            $lines[] = [
                'product_id' => (string) $pid, 'name' => $post->post_title, 'price' => $price, 'quantity' => $it['quantity'],
                'image' => $ids ? (string) wp_get_attachment_url((int) $ids[0]) : '', 'size' => $size,
                'color' => isset($it['color']) && $it['color'] !== '' ? (string) $it['color'] : null,
            ];
        }

        $zone = (string) ($b['shippingZone'] ?? '');
        $shipping = ($zone === 'inside' || ($b['selectedDistrictId'] ?? '') === '47') ? 70 : 120;

        $discount = 0.0;
        $coupon = null;
        if (!empty($b['couponCode'])) {
            $c = NF_Coupons::find((string) $b['couponCode']);
            if ($c && $c['is_active']
                && (!$c['expires_at'] || $c['expires_at'] > time())
                && (!$c['min_order'] || $subtotal >= $c['min_order'])) {
                $discount = NF_Coupons::discount_for($c, $subtotal);
                $coupon = $c;
            }
        }
        if ($coupon && !NF_Coupons::consume($coupon)) {
            return $err('কুপনটির ব্যবহারসীমা শেষ হয়ে গেছে।');
        }

        $public_id = 'NF-' . strtoupper(bin2hex(random_bytes(16)));
        try {
            $order = self::build_order($public_id, 'pending', ['name' => $name, 'phone' => $norm, 'address' => $address, 'ip' => $ip !== 'unknown' ? $ip : ''], $lines, $subtotal, $shipping, $discount, $coupon['code'] ?? null);
        } catch (Throwable $e) {
            if ($coupon) {
                NF_Coupons::release($coupon);
            }
            error_log('[NF ORDER] create failed: ' . $e->getMessage());
            return $err('Internal server error', 500);
        }
        $order->update_meta_data('_nf_capi_sent', 1);
        $order->save();

        $total = $subtotal - $discount + $shipping;
        NF_CAPI::send_purchase([
            'order_id' => $public_id, 'total' => $total, 'phone' => $norm, 'customer_name' => $name, 'ip' => $ip,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '', 'source_url' => home_url('/thank-you/' . $public_id),
            'contents' => array_map(static fn($l) => ['id' => $l['product_id'], 'quantity' => $l['quantity'], 'item_price' => $l['price']], $lines),
        ]);
        do_action('nf_order_created', $order, $public_id);

        return new WP_REST_Response([
            'success' => true, 'orderId' => $public_id, 'total' => $total, 'subtotal' => $subtotal,
            'shipping' => $shipping, 'discount' => $discount, 'purchaseTracked' => true,
        ]);
    }

    /* ───────────────────────── drafts (abandoned checkouts) ───────────────────────── */

    public static function draft(WP_REST_Request $req): WP_REST_Response {
        $b = $req->get_json_params() ?: [];
        $session = $b['sessionId'] ?? null;
        if (!$session || !is_string($session)) {
            return new WP_REST_Response(['error' => 'Session ID required'], 400);
        }
        $ip = NF_REST::client_ip();
        $name = trim((string) ($b['name'] ?? '')) ?: '—';
        $phone = trim((string) ($b['phone'] ?? '')) ?: '—';
        $address = trim((string) ($b['address'] ?? '')) ?: '—';

        if ($phone !== '—') {
            if (self::is_blocked($phone, $ip)) {
                return new WP_REST_Response(['error' => 'Blocked'], 403);
            }
        } elseif ($ip !== 'unknown' && self::is_blocked('', $ip)) {
            return new WP_REST_Response(['error' => 'Blocked'], 403);
        }

        $shipping = ($b['shippingZone'] ?? '') === 'inside' ? 70 : 120;
        $lines = [];
        $subtotal = 0.0;
        foreach ((array) ($b['items'] ?? []) as $it) {
            $price = self::parse_price($it['price'] ?? 0);
            $qty = max(1, (int) ($it['quantity'] ?? 1));
            $subtotal += $price * $qty;
            $lines[] = [
                'product_id' => (string) ($it['id'] ?? $it['productId'] ?? 'unknown'), 'name' => (string) ($it['name'] ?? 'Unknown Product'),
                'price' => $price, 'quantity' => $qty, 'image' => (string) ($it['image'] ?? ''), 'size' => $it['size'] ?? null, 'color' => $it['color'] ?? null,
            ];
        }

        $existing = wc_get_orders(['limit' => 1, 'meta_key' => '_nf_draft_session_id', 'meta_value' => $session, 'status' => 'wc-' . self::wc_status('incomplete'), 'orderby' => 'date', 'order' => 'DESC']);
        $public_id = $existing ? (string) $existing[0]->get_meta('_nf_order_id') : 'DRAFT-' . strtoupper(bin2hex(random_bytes(8)));
        if ($existing) {
            $existing[0]->delete(true);
        }
        $order = self::build_order($public_id, 'incomplete', ['name' => $name, 'phone' => $phone, 'address' => $address, 'ip' => $ip !== 'unknown' ? $ip : '', 'draft_session' => $session], $lines, $subtotal, $shipping, 0.0, null);
        return new WP_REST_Response(['success' => true, 'id' => (string) $order->get_id()]);
    }

    public static function delete_draft(WP_REST_Request $req): WP_REST_Response {
        $b = $req->get_json_params() ?: [];
        $session = $b['sessionId'] ?? '';
        if ($session) {
            foreach (wc_get_orders(['limit' => -1, 'meta_key' => '_nf_draft_session_id', 'meta_value' => $session, 'status' => 'wc-' . self::wc_status('incomplete')]) as $o) {
                $o->delete(true);
            }
        }
        return new WP_REST_Response(['success' => true]);
    }
}
