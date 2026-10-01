<?php
defined('ABSPATH') || exit;
$reviews = array_values(array_filter(nf_testimonials(), static fn($t) => ($t['type'] ?? '') === 'review'));
if (!$reviews) {
    return;
}
?>
<section class="bg-white py-12 md:py-16">
  <div class="mx-auto max-w-[1280px] px-6 md:px-10">
    <div class="text-center mb-8">
      <p class="section-eyebrow mb-2">What Our Customers Say</p>
      <h2 class="text-[24px] md:text-[32px] font-bold text-[#1a1a1a]">Customer Reviews</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
      <?php foreach (array_slice($reviews, 0, 4) as $r) :
        $rating = isset($r['rating']) ? (int) $r['rating'] : 5; ?>
        <div class="flex flex-col">
          <div class="relative aspect-square overflow-hidden rounded-lg bg-[#f5f5f5] group">
            <?php if (!empty($r['image_url'])) : ?>
              <img src="<?php echo esc_url($r['image_url']); ?>" alt="<?php echo esc_attr($r['name']); ?>" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            <?php else : ?>
              <div class="h-full w-full flex items-center justify-center bg-[#1a3c2e]/10"><span class="text-[40px] font-bold text-[#1a3c2e]/30"><?php echo esc_html(mb_substr((string) ($r['name'] ?: 'R'), 0, 1)); ?></span></div>
            <?php endif; ?>
            <?php if (!empty($r['video_url'])) : ?>
              <button type="button" data-nf-video="<?php echo esc_attr($r['video_url']); ?>" class="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"><?php echo nf_icon('play', 16, 'text-[#1a3c2e] ml-0.5', 2, 'currentColor'); ?></div>
              </button>
            <?php endif; ?>
          </div>
          <div class="mt-3">
            <div class="flex items-center gap-0.5 mb-1">
              <?php for ($i = 0; $i < 5; $i++) {
                  echo nf_icon('star', 13, $i < $rating ? 'text-amber-400 fill-amber-400' : 'text-[#ddd] fill-[#ddd]');
              } ?>
            </div>
            <p class="text-[13px] font-semibold text-[#1a1a1a]"><?php echo esc_html($r['name']); ?></p>
            <?php if (!empty($r['quote'])) : ?><p class="text-[12px] text-[#777] mt-1 line-clamp-2 leading-relaxed"><?php echo esc_html($r['quote']); ?></p><?php endif; ?>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>

  <div data-nf-video-modal hidden class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
    <div class="relative w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl" data-nf-video-box>
      <button type="button" data-nf-video-close class="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition-colors"><?php echo nf_icon('x', 16); ?></button>
      <div data-nf-video-slot class="h-full w-full"></div>
    </div>
  </div>
</section>
