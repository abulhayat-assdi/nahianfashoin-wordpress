<?php
defined('ABSPATH') || exit;
$offers = nf_combo_offers();
if (!$offers) {
    return;
}
?>
<section class="bg-[#1a1a1a] py-12 md:py-16">
  <div class="mx-auto max-w-[1280px] px-6 md:px-10">
    <div class="text-center mb-8 md:mb-10">
      <p class="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#888] mb-2">Save More</p>
      <h2 class="text-[24px] md:text-[32px] font-bold text-white">Combo Offer</h2>
      <p class="text-[14px] text-[#888] mt-2">Save more with our exclusive combos</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      <?php foreach ($offers as $offer) : ?>
        <div class="relative bg-[#252525] rounded-lg overflow-hidden group">
          <div class="relative aspect-[4/3] overflow-hidden bg-[#333]">
            <?php if (!empty($offer['image_id'])) :
              echo nf_img((int) $offer['image_id'], 'large', [
                  'alt' => $offer['title'], 'loading' => 'lazy',
                  'class' => 'absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
              ], '(max-width: 768px) 100vw, 33vw');
            else : ?>
              <div class="h-full w-full bg-[#1a3c2e]/30 flex items-center justify-center"><span class="text-white/20 text-5xl font-bold"><?php echo esc_html(mb_substr($offer['title'], 0, 1)); ?></span></div>
            <?php endif; ?>
            <?php if (!empty($offer['video_url'])) : ?>
              <a href="<?php echo esc_url($offer['video_url']); ?>" target="_blank" rel="noopener noreferrer" class="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors"><?php echo nf_icon('play', 20, 'text-[#1a3c2e] ml-1', 2, 'currentColor'); ?></div>
              </a>
            <?php endif; ?>
            <?php if (!empty($offer['badge'])) : ?>
              <span class="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm uppercase"><?php echo esc_html($offer['badge']); ?></span>
            <?php endif; ?>
          </div>
          <div class="p-4">
            <h3 class="text-[15px] font-bold text-white"><?php echo esc_html($offer['title']); ?></h3>
            <?php if (!empty($offer['subtitle'])) : ?><p class="text-[13px] text-[#888] mt-0.5"><?php echo esc_html($offer['subtitle']); ?></p><?php endif; ?>
            <div class="mt-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-[17px] font-bold text-[#4ade80]"><?php echo esc_html($offer['price']); ?></span>
                <?php if (!empty($offer['original_price'])) : ?><span class="text-[13px] text-[#666] line-through"><?php echo esc_html($offer['original_price']); ?></span><?php endif; ?>
              </div>
              <a href="<?php echo esc_url(nf_url('/collections/all')); ?>" class="bg-[#1a3c2e] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#0f2a1e] transition-colors">SHOP NOW</a>
            </div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>
