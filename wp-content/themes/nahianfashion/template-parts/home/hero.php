<?php
defined('ABSPATH') || exit;
$cfg     = nf_home_config();
$banners = array_values(array_filter((array) ($cfg['banners'] ?? []), static fn($b) => !empty($b['image_id'])));
$text    = (array) ($cfg['hero_text'] ?? []);
$default_link = !empty($text['btn_link']) ? $text['btn_link'] : '/collections/all';
$href = static fn($l) => preg_match('#^https?://#i', (string) $l) ? $l : nf_url($l);
$has_text = !empty($text['eyebrow']) || !empty($text['title']) || !empty($text['subtitle']) || !empty($text['btn_text']);

ob_start(); // text overlay shared by both variants
?>
<?php if (!empty($text['eyebrow'])) : ?><p class="text-[10px] md:text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80 mb-2 md:mb-4"><?php echo esc_html($text['eyebrow']); ?></p><?php endif; ?>
<?php if (!empty($text['title'])) : ?><h1 class="text-[28px] md:text-[62px] font-bold leading-[1.1] text-white mb-2 md:mb-4"><?php echo esc_html($text['title']); ?></h1><?php endif; ?>
<?php if (!empty($text['subtitle'])) : ?><p class="text-[13px] md:text-[20px] text-white/85 mb-5 md:mb-8 font-light"><?php echo esc_html($text['subtitle']); ?></p><?php endif; ?>
<?php
$text_block = ob_get_clean();

if (!$banners) : ?>
<a href="<?php echo esc_url($href($default_link)); ?>" class="block relative w-full aspect-[16/9] md:aspect-auto md:h-[90vh] md:max-h-[800px] bg-[#1a3c2e]">
  <div class="relative z-10 flex h-full items-center px-6 md:px-20">
    <div class="max-w-[520px]">
      <?php echo $text_block; ?>
      <?php if (!empty($text['btn_text'])) : ?><span class="inline-flex items-center bg-[#c9a227] text-white px-6 md:px-8 py-2.5 md:py-3.5 text-[11px] md:text-[13px] font-bold uppercase tracking-widest hover:bg-[#b8911f] transition-colors shadow-lg"><?php echo esc_html($text['btn_text']); ?></span><?php endif; ?>
    </div>
  </div>
</a>
<?php return; endif; ?>

<div class="relative w-full aspect-[16/9] md:aspect-auto md:h-[90vh] md:max-h-[800px] overflow-hidden bg-[#1a3c2e] select-none" data-nf-hero data-count="<?php echo count($banners); ?>">
  <?php foreach ($banners as $i => $b) : ?>
    <div data-hero-slide data-link="<?php echo esc_attr($href(!empty($b['link']) ? $b['link'] : $default_link)); ?>" class="absolute inset-0 transition-opacity duration-700 ease-in-out <?php echo $i === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'; ?>">
      <?php echo nf_img((int) $b['image_id'], 'full', [
          'alt'           => 'Banner ' . ($i + 1),
          'class'         => 'absolute inset-0 h-full w-full object-cover object-center',
          'loading'       => $i === 0 ? 'eager' : 'lazy',
          'fetchpriority' => $i === 0 ? 'high' : 'auto',
      ], '100vw'); ?>
      <div class="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent"></div>
    </div>
  <?php endforeach; ?>

  <a data-hero-link href="<?php echo esc_url($href(!empty($banners[0]['link']) ? $banners[0]['link'] : $default_link)); ?>" class="absolute inset-0 z-10" aria-label="View collection"></a>

  <?php if ($has_text) : ?>
    <div class="relative z-20 flex h-full items-center px-6 md:px-20 pointer-events-none">
      <div class="max-w-[520px]">
        <?php echo $text_block; ?>
        <?php if (!empty($text['btn_text'])) : ?><a href="<?php echo esc_url($href($default_link)); ?>" class="pointer-events-auto inline-flex items-center bg-[#c9a227] text-white px-6 md:px-8 py-2.5 md:py-3.5 text-[11px] md:text-[13px] font-bold uppercase tracking-widest hover:bg-[#b8911f] transition-colors shadow-lg"><?php echo esc_html($text['btn_text']); ?></a><?php endif; ?>
      </div>
    </div>
  <?php endif; ?>

  <?php if (count($banners) > 1) : ?>
    <button type="button" data-hero-prev class="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-colors" aria-label="Previous banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-5 w-5"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button type="button" data-hero-next class="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-colors" aria-label="Next banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-5 w-5"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
      <?php foreach ($banners as $i => $b) : ?>
        <button type="button" data-hero-dot="<?php echo $i; ?>" class="rounded-full transition-all duration-300 <?php echo $i === 0 ? 'bg-white w-6 h-2.5' : 'bg-white/50 w-2.5 h-2.5 hover:bg-white/75'; ?>" aria-label="Go to banner <?php echo $i + 1; ?>"></button>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
