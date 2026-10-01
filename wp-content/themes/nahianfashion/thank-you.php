<?php
/**
 * Order confirmation (/thank-you/<orderId>). Standalone page (no site header/footer), like the original.
 */
defined('ABSPATH') || exit;
$GLOBALS['nf_bare'] = true;
nf_set_seo(['title' => 'Order Confirmation | Nahian Fashion', 'noindex' => true, 'follow' => false]);

$arg = rawurldecode((string) get_query_var('nf_arg'));
$order = null;
if ($arg !== '' && strpos($arg, 'DRAFT-') !== 0 && class_exists('NF_Orders')) {
    $wc = NF_Orders::find_by_public_id($arg);
    if ($wc) {
        $data = NF_Orders::to_array($wc);
        if (!in_array($data['status'], ['incomplete', 'failed', 'cancelled'], true)) {
            $order = $data;
        }
    }
}
$fmt = static fn($n) => 'Tk ' . number_format((float) $n, 2);
$ok_icon = static fn($size, $cls) => nf_icon('circle-check-big', $size, $cls);

get_header();

if ($arg === '') : // /thank-you: send the browser to the last placed order, else home ?>
<div class="min-h-screen flex items-center justify-center bg-[#f0fdf4]" data-nf-thankyou-redirect data-home="<?php echo esc_attr(untrailingslashit(home_url())); ?>">
  <div class="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
</div>
<?php elseif (!$order) : ?>
<div class="min-h-screen bg-[#f0fdf4] flex flex-col items-center justify-center px-4 text-center">
  <?php echo $ok_icon(56, 'text-green-500 mb-4'); ?>
  <h1 class="text-[24px] font-bold text-[#222] mb-2">Order Not Found</h1>
  <p class="text-[14px] text-[#666] mb-4">Order <span class="font-mono font-bold"><?php echo esc_html($arg); ?></span> could not be loaded.</p>
  <a href="<?php echo esc_url(nf_url('/')); ?>" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-[13px] font-bold transition-colors">Continue Shopping</a>
</div>
<?php else :
    $is_online = $order['payment_method'] !== 'cash';
    $item_count = array_sum(array_column($order['items'], 'quantity'));
    $purchase = [
        'orderId' => $order['order_id'], 'total' => $order['total'], 'shipping' => $order['shipping'], 'discount' => $order['discount'],
        'items' => array_map(static fn($i) => [
            'item_id' => $i['product_id'], 'item_name' => $i['product_name'], 'item_brand' => 'Nahian Fashion',
            'item_category' => $i['category'] ?: 'Fashion', 'price' => nf_parse_price($i['price']), 'quantity' => $i['quantity'],
        ], $order['items']),
    ];
?>
<div class="min-h-screen bg-[#f0fdf4]" data-nf-purchase="<?php echo esc_attr(wp_json_encode($purchase, JSON_UNESCAPED_UNICODE)); ?>">
  <header class="w-full bg-white border-b border-[#d1fae5] py-5 px-6">
    <div class="max-w-[760px] mx-auto flex justify-between items-center">
      <a href="<?php echo esc_url(nf_url('/')); ?>" class="text-[28px] font-heading text-green-700 font-medium">Nahian Fashion</a>
      <div class="flex items-center gap-4">
        <button type="button" data-nf-invoice class="flex items-center gap-2 bg-green-50 border border-green-600 text-green-700 hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
          <span data-invoice-idle class="flex items-center gap-2"><?php echo nf_icon('download', 16); ?> Download Invoice</span>
          <span data-invoice-busy hidden class="flex items-center gap-2"><?php echo nf_icon('loader-circle', 16, 'animate-spin'); ?> Downloading...</span>
        </button>
        <a href="<?php echo esc_url(nf_url('/')); ?>" class="text-[14px] text-[#666] hover:text-green-700 transition hidden sm:inline">← Continue Shopping</a>
      </div>
    </div>
  </header>

  <main class="max-w-[760px] mx-auto px-4 py-10 space-y-6">
    <div data-nf-invoice-target class="space-y-6 bg-[#f0fdf4] p-2 sm:p-6 rounded-3xl relative overflow-hidden">
      <div class="bg-white rounded-2xl border border-[#d1fae5] shadow-sm overflow-hidden">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #10b981 100%)" class="px-6 py-10 text-center">
          <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"><?php echo $ok_icon(38, 'text-white'); ?></div>
          <h1 class="text-[26px] font-bold text-white mb-1">Thank You for Your Order!</h1>
          <p class="text-white/85 text-[15px]">Your order has been placed successfully.</p>
        </div>
        <div class="px-6 py-4 bg-[#f0fdf4] flex flex-wrap gap-4 justify-between text-[13px] border-t border-[#d1fae5]">
          <span class="text-[#555]">Order ID: <strong class="text-green-700 font-mono"><?php echo esc_html($order['order_id']); ?></strong></span>
          <span class="text-[#555]">Date: <strong class="text-[#222]" data-nf-date="<?php echo esc_attr($order['placed_at']); ?>"><?php echo esc_html($order['placed_at']); ?></strong></span>
          <span class="font-bold px-3 py-1 rounded-full text-[12px] <?php echo $is_online ? 'bg-green-100 text-green-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'; ?>"><?php echo $is_online ? '✓ Payment Received' : 'Cash on Delivery'; ?></span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-[#d1fae5] shadow-sm p-6">
        <h2 class="text-[16px] font-bold text-[#222] mb-4 flex items-center gap-2"><?php echo nf_icon('user', 18, 'text-green-600'); ?> Customer Details</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-start gap-3"><?php echo nf_icon('user', 16, 'text-[#999] mt-0.5 flex-shrink-0'); ?><div><p class="text-[11px] text-[#999] uppercase tracking-wide mb-0.5">Full Name</p><p class="text-[14px] font-bold text-[#222]"><?php echo esc_html($order['customer_name']); ?></p></div></div>
          <div class="flex items-start gap-3"><?php echo nf_icon('phone', 16, 'text-[#999] mt-0.5 flex-shrink-0'); ?><div><p class="text-[11px] text-[#999] uppercase tracking-wide mb-0.5">Mobile</p><p class="text-[14px] font-bold text-[#222]"><?php echo esc_html($order['phone']); ?></p></div></div>
          <div class="flex items-start gap-3 sm:col-span-2"><?php echo nf_icon('map-pin', 16, 'text-[#999] mt-0.5 flex-shrink-0'); ?><div><p class="text-[11px] text-[#999] uppercase tracking-wide mb-0.5">Delivery Address</p><p class="text-[14px] font-bold text-[#222]"><?php echo esc_html($order['address']); ?></p></div></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-[#d1fae5] shadow-sm p-6">
        <h2 class="text-[16px] font-bold text-[#222] mb-4 flex items-center gap-2"><?php echo nf_icon('package', 18, 'text-green-600'); ?> Order Items (<?php echo (int) $item_count; ?> items)</h2>
        <div class="space-y-3 mb-5">
          <?php foreach ($order['items'] as $item) : ?>
            <div class="border border-[#e8f5e9] rounded-xl overflow-hidden last:mb-0">
              <div class="flex gap-3 items-center p-3">
                <div class="relative w-14 h-14 rounded-lg overflow-hidden border border-[#d1fae5] bg-[#f0fdf4] flex-shrink-0 flex items-center justify-center">
                  <?php if (trim((string) $item['image_url']) !== '') : ?>
                    <img src="<?php echo esc_url($item['image_url']); ?>" alt="<?php echo esc_attr($item['product_name']); ?>" class="absolute inset-0 h-full w-full object-cover" />
                  <?php else : ?>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="w-7 h-7 text-[#ccc]"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/><path d="M3 9l4-4 4 4 4-4 4 4" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="14" r="2" stroke-width="1.5"/></svg>
                  <?php endif; ?>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-bold text-[#222] line-clamp-2"><?php echo esc_html($item['product_name']); ?></p>
                  <p class="text-[12px] text-[#777] mt-0.5"><?php echo esc_html($item['price']); ?> × <?php echo (int) $item['quantity']; ?></p>
                </div>
                <p class="text-[14px] font-bold text-[#222] flex-shrink-0"><?php echo esc_html($fmt(nf_parse_price($item['price']) * $item['quantity'])); ?></p>
              </div>
              <?php if ($item['size'] || $item['color']) : ?>
                <div class="border-t border-[#e8f5e9] bg-[#f7fef9] px-3 py-2.5 flex gap-5 items-center flex-wrap">
                  <?php if ($item['size']) : ?>
                    <div class="flex items-center gap-2"><span class="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">SIZE</span><span class="text-[15px] font-extrabold text-green-700 bg-green-50 border-2 border-green-300 rounded-md px-3 py-0.5 tracking-wide"><?php echo esc_html($item['size']); ?></span></div>
                  <?php endif; ?>
                  <?php if ($item['color']) : $c = $item['color']; ?>
                    <div class="flex items-center gap-2"><span class="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">COLOR</span>
                      <?php if (strpos($c, 'http') === 0 || strpos($c, '/') === 0) : ?>
                        <div class="flex items-center gap-2"><img src="<?php echo esc_url($c); ?>" alt="selected color" class="w-10 h-10 rounded-md object-cover flex-shrink-0 border-2 border-green-300" /><span class="text-[11px] text-[#666]">Selected</span></div>
                      <?php else : ?>
                        <div class="flex items-center gap-2"><div class="w-7 h-7 rounded-md border-2 border-[#ccc] flex-shrink-0" style="background: <?php echo esc_attr($c); ?>"></div><span class="text-[12px] font-semibold text-[#333]"><?php echo esc_html($c); ?></span></div>
                      <?php endif; ?>
                    </div>
                  <?php endif; ?>
                </div>
              <?php endif; ?>
            </div>
          <?php endforeach; ?>
        </div>

        <div class="bg-[#f0fdf4] rounded-xl p-4 space-y-2 border border-[#d1fae5]">
          <div class="flex justify-between text-[13px] text-[#555]"><span>Subtotal</span><span><?php echo esc_html($fmt($order['subtotal'])); ?></span></div>
          <?php if ($order['discount'] > 0) : ?><div class="flex justify-between text-[13px] text-green-600"><span>Discount</span><span>- <?php echo esc_html($fmt($order['discount'])); ?></span></div><?php endif; ?>
          <div class="flex justify-between text-[13px] text-[#555]"><span>Delivery Charge</span><span><?php echo esc_html($fmt($order['shipping'])); ?></span></div>
          <div class="flex justify-between text-[16px] font-bold text-[#222] border-t border-[#d1fae5] pt-2 mt-2"><span>Total Amount</span><span class="text-green-700"><?php echo esc_html($fmt($order['total'])); ?></span></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-[#d1fae5] shadow-sm p-6">
        <h2 class="text-[16px] font-bold text-[#222] mb-4 flex items-center gap-2"><?php echo nf_icon('credit-card', 18, 'text-green-600'); ?> Payment Information</h2>
        <div class="grid grid-cols-2 gap-4 text-[13px]">
          <div><p class="text-[#999] uppercase tracking-wide text-[11px] mb-1">Payment Method</p><p class="font-bold text-[#222]"><?php echo $order['payment_method'] === 'cash' ? 'Cash on Delivery' : ($order['payment_method'] === 'sslcommerz' ? 'SSLCommerz' : 'bKash'); ?></p></div>
          <div><p class="text-[#999] uppercase tracking-wide text-[11px] mb-1"><?php echo $is_online ? 'Amount Paid' : 'Amount to Pay'; ?></p><p class="font-bold text-green-700"><?php echo esc_html($fmt($order['total'])); ?></p></div>
        </div>
        <?php if (!$is_online) : ?>
          <div class="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-[13px] text-emerald-800">Please keep <strong><?php echo esc_html($fmt($order['total'])); ?></strong> ready at the time of delivery.</div>
        <?php else : ?>
          <div class="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-[13px] text-green-700">✓ Payment of <strong><?php echo esc_html($fmt($order['total'])); ?></strong> has been received successfully.</div>
        <?php endif; ?>
      </div>
    </div>

  </main>
</div>
<?php
    wp_enqueue_script('nf-html-to-image', get_theme_file_uri('assets/vendor/html-to-image.js'), [], '1.11.13', ['in_footer' => true]);
    wp_enqueue_script('nf-jspdf', get_theme_file_uri('assets/vendor/jspdf.umd.min.js'), [], '4.2.1', ['in_footer' => true]);
    wp_enqueue_script('nf-thankyou', get_theme_file_uri('assets/js/thank-you.js'), ['nf-html-to-image', 'nf-jspdf'], filemtime(get_theme_file_path('assets/js/thank-you.js')), ['in_footer' => true]);
endif;
if ($arg === '') {
    wp_enqueue_script('nf-thankyou', get_theme_file_uri('assets/js/thank-you.js'), [], filemtime(get_theme_file_path('assets/js/thank-you.js')), ['in_footer' => true]);
}
get_footer();
