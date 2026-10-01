<?php
/**
 * Collection (category listing) page: /collections/all and /collections/<slug>[+<slug>...].
 */
defined('ABSPATH') || exit;

$raw = (string) get_query_var('nf_collection');
$raw = str_replace(['%2B', ' '], '+', rawurldecode($raw));
$active = $raw === 'all' ? [] : array_values(array_filter(explode('+', $raw), 'strlen'));

$categories = array_map(static fn($c) => ['id' => $c->term_id, 'name' => trim($c->name), 'slug' => $c->slug], nf_categories());
$cat_by_slug = [];
foreach ($categories as $c) {
    $cat_by_slug[strtolower($c['slug'])] = $c;
}
$active = array_map('strtolower', $active);

$products = nf_get_products();
if ($active) {
    $products = array_values(array_filter($products, static fn($p) => in_array(strtolower($p['category_slug']), $active, true)));
}

$page_title = 'All Collections';
if ($active) {
    $page_title = implode(' & ', array_map(static fn($s) => $cat_by_slug[$s]['name'] ?? $s, $active));
}
$canonical = nf_url('/collections/' . $raw);
$site = untrailingslashit(home_url());
$desc = "Shop {$page_title} — premium quality fashion and panjabi from Nahian Fashion, Bangladesh.";
nf_set_seo([
    'title'       => $page_title . ' | Nahian Fashion',
    'description' => $desc,
    'canonical'   => $canonical,
    'image'       => nf_logo_url(),
]);

$breadcrumb_ld = [
    '@context' => 'https://schema.org',
    '@type'    => 'BreadcrumbList',
    'itemListElement' => [
        ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => $site],
        ['@type' => 'ListItem', 'position' => 2, 'name' => $page_title, 'item' => $canonical],
    ],
];
$count = count($products);

function nf_collection_filter_panel(array $categories, array $active): void { ?>
  <div class="space-y-3" data-nf-filter>
    <div class="border border-[#e5e5e5] rounded-lg overflow-hidden">
      <button type="button" data-nf-filter-toggle class="flex w-full items-center justify-between px-4 py-3.5 bg-white text-[15px] font-semibold text-[#1a1a1a] hover:bg-[#f9f9f9] transition-colors">
        Categories
        <span data-nf-filter-chevron class="rotate-180 transition-transform duration-200 text-[#666]"><?php echo nf_icon('chevron-down', 17); ?></span>
      </button>
      <div data-nf-filter-body class="px-4 pb-4 pt-2 bg-white border-t border-[#f0f0f0] space-y-3">
        <?php foreach ($categories as $cat) : $on = in_array(strtolower($cat['slug']), $active, true); ?>
          <label class="flex cursor-pointer items-center justify-between group">
            <span class="text-[14px] transition-colors <?php echo $on ? 'text-[#1a3c2e] font-semibold' : 'text-[#555] group-hover:text-[#1a1a1a]'; ?>"><?php echo esc_html($cat['name']); ?></span>
            <input type="checkbox" data-slug="<?php echo esc_attr($cat['slug']); ?>" <?php checked($on); ?> class="h-[17px] w-[17px] cursor-pointer accent-[#1a3c2e]" />
          </label>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
<?php }

function nf_collection_sort_select(string $height, string $pr, string $pos): void { ?>
  <select data-nf-sort class="<?php echo esc_attr($height); ?> pl-3 <?php echo esc_attr($pr); ?> border border-[#ddd] rounded-md text-[13px] font-medium text-[#333] bg-white outline-none focus:border-[#1a3c2e] appearance-none cursor-pointer"
    style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right <?php echo esc_attr($pos); ?> center; background-size: 13px;">
    <option value="featured">Featured</option>
    <option value="price-asc">Price: Low → High</option>
    <option value="price-desc">Price: High → Low</option>
  </select>
<?php }

ob_start();
foreach ($products as $i => $product) {
    get_template_part('template-parts/product-card', null, ['product' => $product, 'priority' => $i < 4, 'reviews' => 0, 'show_new' => false]);
}
$cards_html = ob_get_clean();

get_header(); ?>
<script type="application/ld+json"><?php echo wp_json_encode($breadcrumb_ld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<section class="bg-[#f9f9f9] min-h-screen">
  <div class="bg-white border-b border-[#eeeeee]">
    <div class="mx-auto max-w-[1280px] px-4 md:px-10 py-3 md:py-10 text-center">
      <h1 class="text-[18px] md:text-[44px] font-bold text-[#1a1a1a] leading-tight"><?php echo esc_html($page_title); ?></h1>
      <p class="hidden md:block mt-2 text-[14px] md:text-[16px] font-semibold text-[#555]">Explore our premium selection of carefully curated products.</p>
    </div>
  </div>

  <div class="mx-auto max-w-[1280px] px-4 md:px-10 py-3 md:py-8">
    <!-- Mobile top bar -->
    <div class="flex items-center justify-between gap-3 mb-3 md:hidden">
      <button type="button" data-nf-filters-open class="flex items-center gap-2 px-4 py-2.5 border-2 border-[#1a3c2e] text-[#1a3c2e] text-[13px] font-bold uppercase tracking-wide rounded-md hover:bg-[#1a3c2e] hover:text-white transition-colors">
        <?php echo nf_icon('sliders-horizontal', 14); ?>
        Filters
        <?php if ($active) : ?><span class="bg-[#1a3c2e] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none -mr-1"><?php echo count($active); ?></span><?php endif; ?>
      </button>
      <div class="flex items-center gap-2">
        <span class="text-[12px] text-[#888] font-medium"><?php echo $count; ?> products</span>
        <?php nf_collection_sort_select('h-[38px]', 'pr-7', '8px'); ?>
      </div>
    </div>

    <!-- Mobile filter drawer -->
    <div data-nf-filters-drawer hidden>
      <div class="fixed inset-0 z-[200] bg-black/50 md:hidden" data-nf-filters-close></div>
      <div class="fixed inset-y-0 left-0 z-[210] w-[280px] bg-white shadow-2xl md:hidden flex flex-col">
        <div class="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
          <h2 class="text-[18px] font-bold text-[#1a1a1a]">Filters</h2>
          <button type="button" data-nf-filters-close class="text-[#666] hover:text-[#222] transition-colors"><?php echo nf_icon('x', 22); ?></button>
        </div>
        <div class="flex-1 overflow-y-auto p-4"><?php nf_collection_filter_panel($categories, $active); ?></div>
        <div class="p-4 border-t border-[#f0f0f0]">
          <button type="button" data-nf-filters-close class="w-full py-3 bg-[#1a3c2e] text-white font-bold text-[14px] rounded-md hover:bg-[#0f2a1e] transition-colors">Show <?php echo $count; ?> Products</button>
        </div>
      </div>
    </div>

    <!-- Desktop: sidebar + main -->
    <div class="hidden md:grid md:grid-cols-[240px_1fr] gap-8 items-start">
      <aside>
        <div class="bg-white rounded-lg border border-[#e5e5e5] p-5 sticky top-[80px]">
          <h2 class="text-[15px] font-bold text-[#1a1a1a] mb-4 pb-3 border-b border-[#f0f0f0]">Filters</h2>
          <?php nf_collection_filter_panel($categories, $active); ?>
        </div>
      </aside>

      <div>
        <div class="flex items-center justify-between mb-5 bg-white border border-[#e5e5e5] rounded-lg px-4 py-3">
          <span class="text-[14px] text-[#666]"><span class="font-bold text-[#1a1a1a]"><?php echo $count; ?></span> products found</span>
          <div class="flex items-center gap-2">
            <span class="text-[13px] text-[#888]">Sort By:</span>
            <?php nf_collection_sort_select('h-[36px]', 'pr-8', '10px'); ?>
          </div>
        </div>

        <?php if ($count) : ?>
          <div data-nf-grid class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"><?php echo $cards_html; ?></div>
        <?php else : ?>
          <div class="py-24 text-center bg-white rounded-lg border border-[#e5e5e5]">
            <p class="text-[18px] text-[#999] font-medium">No products found in this category.</p>
            <a href="<?php echo esc_url(nf_url('/collections/all')); ?>" class="mt-5 inline-block px-7 py-3 bg-[#1a3c2e] text-white rounded-md text-[14px] font-bold hover:bg-[#0f2a1e] transition-colors">View all products</a>
          </div>
        <?php endif; ?>
      </div>
    </div>

    <!-- Mobile product grid -->
    <div class="md:hidden">
      <?php if ($count) : ?>
        <div data-nf-grid class="grid grid-cols-2 gap-3"><?php echo $cards_html; ?></div>
      <?php else : ?>
        <div class="py-20 text-center bg-white rounded-lg border border-[#e5e5e5]">
          <p class="text-[16px] text-[#999] font-medium">No products found.</p>
          <a href="<?php echo esc_url(nf_url('/collections/all')); ?>" class="mt-4 inline-block px-6 py-2.5 bg-[#1a3c2e] text-white rounded-md text-[14px] font-bold hover:bg-[#0f2a1e] transition-colors">View all products</a>
        </div>
      <?php endif; ?>
    </div>
  </div>
</section>
<?php get_footer();
