<?php
defined('ABSPATH') || exit;
$badges = [
    ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-7 h-7"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', 'Premium Quality', 'Finest Fabric'],
    ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-7 h-7"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>', 'Easy Exchange', 'Hassle Free'],
    ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-7 h-7"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>', 'Fast Delivery', 'All Over Bangladesh'],
    ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-7 h-7"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', 'Secure Payment', '100% Secure'],
];
?>
<section class="bg-[#1a1a1a] !py-0">
  <div class="mx-auto max-w-[1280px] px-2 md:px-10 py-1.5 md:py-5">
    <div class="grid grid-cols-4 gap-1 md:gap-6">
      <?php foreach ($badges as $b) : ?>
        <div class="flex flex-col md:flex-row items-center md:items-center gap-0.5 md:gap-4 text-center md:text-left">
          <div class="text-[#ac8545] shrink-0 [&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-7 md:[&>svg]:h-7"><?php echo $b[0]; ?></div>
          <div>
            <p class="text-[7.5px] md:text-[12px] font-bold uppercase tracking-tight md:tracking-widest text-[#c9a96e] leading-tight"><?php echo esc_html($b[1]); ?></p>
            <p class="hidden md:block text-[11px] text-[#888] mt-0.5"><?php echo esc_html($b[2]); ?></p>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>
