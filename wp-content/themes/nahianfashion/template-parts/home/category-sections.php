<?php
defined('ABSPATH') || exit;
$cats     = nf_categories();
$products = nf_get_products();
if (!$cats || !$products) {
    return;
}
$sections = [];
foreach ($cats as $cat) {
    $items = array_slice(array_values(array_filter($products, static fn($p) => $p['category_slug'] === $cat->slug)), 0, 4);
    if ($items) {
        $sections[] = [$cat, $items];
    }
}
foreach ($sections as $idx => [$cat, $items]) :
    $bg = $idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]';
    $url = nf_category_url($cat); ?>
<section class="<?php echo $bg; ?> py-6 md:py-12 border-t border-[#f0f0f0]">
  <div class="mx-auto max-w-[1280px] px-3 md:px-10">
    <div class="flex items-center justify-between mb-4 md:mb-7">
      <h2 class="text-[16px] md:text-[24px] font-bold text-[#1a1a1a] leading-tight">Shop <?php echo esc_html(trim($cat->name)); ?> Collection</h2>
      <a href="<?php echo esc_url($url); ?>" class="shrink-0 ml-3 text-[11px] md:text-[13px] font-semibold text-[#1a3c2e] border border-[#1a3c2e] px-3 py-1.5 hover:bg-[#1a3c2e] hover:text-white transition-colors">See All</a>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      <?php foreach ($items as $pi => $product) {
          get_template_part('template-parts/product-card', null, ['product' => $product, 'priority' => $idx === 0 && $pi < 2, 'reviews' => 0]);
      } ?>
    </div>
    <div class="mt-4 md:mt-7 flex justify-center">
      <a href="<?php echo esc_url($url); ?>" class="inline-flex items-center gap-2 bg-[#1a3c2e] text-white px-6 py-2.5 text-[12px] md:text-[13px] font-bold uppercase tracking-wider hover:bg-[#0f2a1e] transition-colors">See All Products</a>
    </div>
  </div>
</section>
<?php endforeach;
