<?php
/**
 * Product card. Args: product (normalized array), priority (bool), reviews (int|string), show_new (bool, default true).
 */
defined('ABSPATH') || exit;
$p        = $args['product'];
$priority = !empty($args['priority']);
$reviews  = (int) ($args['reviews'] ?? 0);
$url      = nf_url('/products/' . ($p['slug'] ?: $p['id']));
$display_price    = nf_price_display($p['price']);
$display_original = $p['original_price'] !== '' ? nf_price_display($p['original_price']) : '';
$discount = $p['discount'];
$is_new   = ($args['show_new'] ?? true) && $discount === '' && $p['original_price'] === '';
$initial  = mb_substr($p['name'], 0, 1);
?>
<article class="relative flex flex-col bg-white border border-[#ebebeb] rounded-lg overflow-hidden group hover:shadow-md transition-shadow duration-300" data-nf-card data-price-num="<?php echo esc_attr((string) nf_parse_price($p['price'])); ?>">
  <a href="<?php echo esc_url($url); ?>" class="block relative">
    <div class="relative aspect-[3/4] w-full overflow-hidden bg-[#f5f5f5]">
      <?php if ($p['image_id']) :
        echo nf_img($p['image_id'], 'large', [
            'alt'           => $p['name'],
            'class'         => 'absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
            'loading'       => $priority ? 'eager' : 'lazy',
            'fetchpriority' => $priority ? 'high' : 'auto',
        ], '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw');
      else : ?>
        <div class="h-full w-full flex items-center justify-center bg-[#f0f0f0]"><span class="text-[#ccc] text-4xl font-bold"><?php echo esc_html($initial); ?></span></div>
      <?php endif; ?>

      <?php if ($discount !== '') :
        $label = (stripos($discount, 'save') === 0 || strpos($discount, '%') !== false) ? $discount : 'Save ' . $discount; ?>
        <span class="absolute top-2.5 right-2.5 bg-[#16a34a] text-white text-[10px] font-bold px-2 py-1 rounded-sm leading-none z-10"><?php echo esc_html($label); ?></span>
      <?php endif; ?>

      <?php if ($is_new) : ?>
        <span class="absolute top-2.5 left-2.5 bg-[#1a3c2e] text-white text-[10px] font-bold px-2 py-1 rounded-sm leading-none uppercase z-10">New</span>
      <?php endif; ?>
    </div>
  </a>

  <div class="flex flex-col flex-1 p-3 md:p-4">
    <a href="<?php echo esc_url($url); ?>">
      <h3 class="text-[13px] md:text-[14px] font-semibold text-[#1a1a1a] leading-snug hover:text-[#1a3c2e] transition-colors line-clamp-2 mb-2"><?php echo esc_html($p['name']); ?></h3>
    </a>

    <div class="flex flex-col gap-0.5 mb-3">
      <?php if ($display_original !== '') : ?>
        <span class="text-[11px] md:text-[12px] text-[#888] line-through"><?php echo esc_html($display_original); ?></span>
      <?php endif; ?>
      <span class="text-[15px] md:text-[16px] font-bold text-[#1a3c2e]"><?php echo esc_html($display_price); ?></span>
    </div>

    <?php if ($reviews > 0) : ?>
      <div class="flex items-center gap-0.5 mb-2">
        <?php for ($i = 0; $i < 5; $i++) : ?>
          <svg viewBox="0 0 24 24" class="w-3 h-3 text-amber-400 fill-amber-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <?php endfor; ?>
        <span class="text-[11px] text-[#888] ml-1">(<?php echo (int) $reviews; ?>)</span>
      </div>
    <?php endif; ?>

    <button type="button" data-nf-card-add<?php echo nf_card_data_attrs($p); ?><?php echo $p['unavailable'] ? ' disabled' : ''; ?>
      class="mt-auto w-full flex items-center justify-center py-2.5 text-[13px] md:text-[14px] font-bold border-2 rounded-sm transition-all duration-200 <?php echo $p['unavailable'] ? 'border-[#ccc] text-[#ccc] cursor-not-allowed' : 'border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e] hover:text-white active:scale-[0.98]'; ?>">
      <?php echo $p['unavailable'] ? 'Unavailable' : 'অর্ডার করুন'; ?>
    </button>
  </div>
</article>
