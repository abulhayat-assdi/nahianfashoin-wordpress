<?php
defined('ABSPATH') || exit;
$cats = nf_categories();
if (!$cats) {
    return;
}
?>
<section class="bg-white py-5 md:py-10">
  <div class="mx-auto max-w-[1280px] px-3 md:px-10">
    <div class="text-center mb-3 md:mb-6">
      <p class="section-eyebrow mb-1">Explore Our Top Categories</p>
      <h2 class="text-[16px] md:text-[28px] font-bold text-[#1a1a1a]">Shop By Category</h2>
    </div>
    <div class="flex flex-nowrap gap-2 overflow-x-auto pb-1 md:gap-5 md:justify-center scrollbar-hide">
      <?php foreach ($cats as $cat) :
        $img_id = (int) get_term_meta($cat->term_id, 'thumbnail_id', true); ?>
        <a href="<?php echo esc_url(nf_category_url($cat)); ?>" class="group flex flex-shrink-0 flex-col items-center gap-1.5 w-[92px] md:w-[130px]">
          <div class="relative w-full h-[110px] md:w-[130px] md:h-[155px] rounded-xl overflow-hidden bg-[#f0ede8] group-hover:shadow-md transition-all duration-300">
            <?php if ($img_id) :
              echo nf_img($img_id, 'medium', [
                  'alt'     => $cat->name,
                  'class'   => 'absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105',
                  'loading' => 'lazy',
              ], '(max-width: 768px) 92px, 130px');
            else : ?>
              <div class="h-full w-full flex items-center justify-center"><span class="text-[28px] font-bold text-[#1a3c2e]/30"><?php echo esc_html(mb_substr($cat->name, 0, 1)); ?></span></div>
            <?php endif; ?>
          </div>
          <span class="text-[11px] md:text-[14px] font-semibold text-[#1a1a1a] group-hover:text-[#1a3c2e] text-center transition-colors leading-tight px-0.5"><?php echo esc_html(trim($cat->name)); ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</section>
