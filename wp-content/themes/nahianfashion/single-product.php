<?php
/**
 * Single product page (/products/<slug>).
 */
defined('ABSPATH') || exit;

$post    = get_queried_object();
$product = nf_normalize_product($post);
$settings = nf_settings();
$reviews = nf_review_stats($post->ID);
$review_count = count($reviews);

/* ---------- gallery sources: product media first, then colour swatch images ---------- */
$media = [];
foreach ($product['image_ids'] as $id) {
    $url = wp_get_attachment_url($id);
    if ($url) {
        $media[] = ['id' => $id, 'url' => $url];
    }
}
$color_images = [];
foreach ($product['colors'] as $c) {
    if (is_string($c) && (strpos($c, 'http') === 0 || strpos($c, '/') === 0)) {
        $color_images[] = ['id' => (int) attachment_url_to_postid($c), 'url' => $c];
    }
}
$images = array_merge($media, $color_images);
$color_offset = count($media);
$first_url = $media[0]['url'] ?? '';

/* ---------- SEO ---------- */
$base = untrailingslashit(home_url());
$url  = nf_url('/products/' . $product['slug']);
$plain = trim(preg_replace('/\s+/', ' ', wp_strip_all_tags($product['description'])));
$desc = $plain !== '' ? mb_substr($plain, 0, 155) : "Buy {$product['name']} online — premium quality fashion from Nahian Fashion, Bangladesh.";
$numeric_price = nf_parse_price($product['price']);
$ld_product = [
    '@context' => 'https://schema.org',
    '@type'    => 'Product',
    'name'     => $product['name'],
    'description' => $product['description'] ?: $product['detail'],
    'image'    => $first_url ? [$first_url] : [],
    'sku'      => $product['id'],
    'url'      => $url,
    'brand'    => ['@type' => 'Brand', 'name' => 'Nahian Fashion'],
    'offers'   => [
        '@type' => 'Offer', 'priceCurrency' => 'BDT', 'price' => $numeric_price,
        'availability' => $product['unavailable'] ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        'url' => $url, 'seller' => ['@type' => 'Organization', 'name' => 'Nahian Fashion'],
    ],
];
if ($review_count) {
    $avg = array_sum(array_column($reviews, 'rating')) / $review_count;
    $ld_product['aggregateRating'] = ['@type' => 'AggregateRating', 'ratingValue' => number_format($avg, 1, '.', ''), 'reviewCount' => $review_count, 'bestRating' => 5, 'worstRating' => 1];
}
nf_set_seo([
    'title'       => $product['name'] . ' | Nahian Fashion',
    'description' => $desc,
    'canonical'   => $url,
    'image'       => $first_url ?: nf_logo_url(),
    'jsonld'      => [
        $ld_product,
        [
            '@context' => 'https://schema.org', '@type' => 'BreadcrumbList',
            'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => $base],
                ['@type' => 'ListItem', 'position' => 2, 'name' => 'Products', 'item' => nf_url('/collections/all')],
                ['@type' => 'ListItem', 'position' => 3, 'name' => $product['name'], 'item' => $url],
            ],
        ],
    ],
]);

$cart_product = [
    'id' => $product['id'], 'name' => $product['name'], 'price' => $product['price'], 'image' => $first_url,
    'detail' => $product['detail'], 'originalPrice' => $product['original_price'], 'discount' => $product['discount'],
    'category' => $product['category_name'],
];
$sizes = array_map(static fn($s) => is_string($s) ? ['size' => $s, 'available' => true] : $s, $product['sizes']);
$colors = $product['colors'];

function nf_video_embed(string $url): ?array {
    if (preg_match('~(?:youtube\.com/(?:watch\?v=|embed/)|youtu\.be/)([a-zA-Z0-9_-]{11})~', $url, $m)) {
        return ['iframe', 'https://www.youtube.com/embed/' . $m[1] . '?rel=0'];
    }
    if (preg_match('~vimeo\.com/(?:video/)?(\d+)~', $url, $m)) {
        return ['iframe', 'https://player.vimeo.com/video/' . $m[1]];
    }
    if (preg_match('~\.(mp4|webm|ogg|mov)$~i', $url)) {
        return ['mp4', $url];
    }
    return null;
}

$kses_tags = [
    'p' => [], 'br' => [], 'strong' => [], 'b' => [], 'em' => [], 's' => [], 'ul' => [], 'ol' => [], 'li' => [],
    'mark' => ['style' => true], 'span' => ['style' => true],
    'h1' => [], 'h2' => [], 'h3' => [], 'h4' => [], 'h5' => [], 'h6' => [],
];

get_header(); ?>
<article class="bg-white">
  <script>
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "view_item",
      event_id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      ecommerce: { currency: "BDT", value: <?php echo wp_json_encode($numeric_price); ?>, items: [{ item_id: <?php echo wp_json_encode($product['id']); ?>, item_name: <?php echo wp_json_encode($product['name']); ?>, item_brand: "Nahian Fashion", item_category: <?php echo wp_json_encode($product['category_name'] ?: 'Fashion'); ?>, price: <?php echo wp_json_encode($numeric_price); ?>, quantity: 1 }] }
    });
  </script>

  <section class="bg-white pt-1 pb-4 md:pb-20">
    <div class="mx-auto max-w-[1280px] px-3 md:px-10">
      <nav aria-label="Breadcrumb" class="text-[11px] mb-1.5 flex flex-wrap items-center gap-1 text-[#999]">
        <a href="<?php echo esc_url(nf_url('/')); ?>" class="hover:text-[#1a3c2e]">Home</a>
        <span>/</span>
        <a href="<?php echo esc_url(nf_url('/collections/all')); ?>" class="hover:text-[#1a3c2e]">Products</a>
        <span>/</span>
        <span class="text-[#1a1a1a]" aria-current="page"><?php echo esc_html($product['name']); ?></span>
      </nav>

      <div class="grid items-start gap-2 md:gap-12 md:grid-cols-[1fr_1fr]">
        <?php /* ---------------- gallery ---------------- */ ?>
        <?php if (!$images) : ?>
          <div class="aspect-square md:aspect-[3/4] w-full bg-[#f5f5f5] flex items-center justify-center text-[#ccc] text-[14px]">No image available</div>
        <?php else : ?>
        <div class="flex gap-2.5" data-nf-gallery data-count="<?php echo count($images); ?>">
          <?php if (count($images) > 1) : ?>
            <div class="flex flex-col gap-2 w-[68px] md:w-[78px] flex-shrink-0">
              <?php foreach ($images as $i => $img) : ?>
                <button type="button" data-gallery-thumb="<?php echo $i; ?>" class="relative aspect-square w-full overflow-hidden border-2 transition-all <?php echo $i === 0 ? 'border-[#1a3c2e]' : 'border-[#e5e5e5] hover:border-[#aaa]'; ?>">
                  <?php echo $img['id'] ? nf_img($img['id'], 'thumbnail', ['alt' => '', 'class' => 'absolute inset-0 h-full w-full object-cover', 'loading' => 'lazy'], '78px') : '<img src="' . esc_url($img['url']) . '" alt="" class="absolute inset-0 h-full w-full object-cover" loading="lazy" />'; ?>
                </button>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>

          <div class="relative flex-1 aspect-square md:aspect-[3/4] bg-[#f5f5f5] overflow-hidden group">
            <button type="button" data-gallery-wish aria-label="Add to wishlist" class="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-sm transition-all">
              <span data-wish-off class="text-[#aaa]"><?php echo nf_icon('heart', 17); ?></span>
              <span data-wish-on hidden class="text-red-500"><?php echo nf_icon('heart', 17, '', 2, 'currentColor'); ?></span>
            </button>

            <div data-gallery-track class="flex h-full w-full transition-transform duration-400 ease-out" style="transform: translateX(-0%)">
              <?php foreach ($images as $i => $img) : ?>
                <div class="relative h-full w-full flex-shrink-0">
                  <?php echo $img['id']
                      ? nf_img($img['id'], 'large', ['alt' => $product['name'] . ' - ' . ($i + 1), 'class' => 'absolute inset-0 h-full w-full object-cover', 'loading' => $i === 0 ? 'eager' : 'lazy', 'fetchpriority' => $i === 0 ? 'high' : 'auto'], '(max-width: 768px) 100vw, 50vw')
                      : '<img src="' . esc_url($img['url']) . '" alt="' . esc_attr($product['name'] . ' - ' . ($i + 1)) . '" class="absolute inset-0 h-full w-full object-cover" />'; ?>
                </div>
              <?php endforeach; ?>
            </div>

            <?php if (count($images) > 1) : ?>
              <button type="button" data-gallery-prev aria-label="Previous image" class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white text-[#1a1a1a] shadow transition-all opacity-0 group-hover:opacity-100"><?php echo nf_icon('chevron-left', 20); ?></button>
              <button type="button" data-gallery-next aria-label="Next image" class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white text-[#1a1a1a] shadow transition-all opacity-0 group-hover:opacity-100"><?php echo nf_icon('chevron-right', 20); ?></button>
              <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                <?php foreach ($images as $i => $img) : ?>
                  <button type="button" data-gallery-dot="<?php echo $i; ?>" class="h-1.5 rounded-full transition-all <?php echo $i === 0 ? 'w-5 bg-white' : 'w-1.5 bg-white/50'; ?>"></button>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>
          </div>
        </div>
        <?php endif; ?>

        <?php /* ---------------- details ---------------- */ ?>
        <div class="flex flex-col">
          <h1 class="font-heading text-[17px] md:text-[32px] font-bold leading-tight text-[#1a1a1a]"><?php echo esc_html($product['name']); ?></h1>

          <div class="mt-1 flex flex-wrap items-center gap-2">
            <span class="text-[18px] md:text-[32px] font-bold text-[#1a3c2e]"><?php echo esc_html(nf_price_display($product['price'])); ?></span>
            <?php if ($product['original_price'] !== '') : ?><span class="text-[16px] text-[#aaa] line-through"><?php echo esc_html(nf_price_display($product['original_price'])); ?></span><?php endif; ?>
            <?php if ($product['discount'] !== '') : ?><span class="bg-red-500 text-white px-2 py-0.5 text-[12px] font-bold rounded"><?php echo esc_html($product['discount']); ?></span><?php endif; ?>
          </div>

          <?php /* ---- action buttons ---- */
          $wa_number = preg_replace('/\D/', '', (string) $settings['whatsapp_number']);
          $tel_number = preg_replace('/[\s\-\(\)]/', '', (string) $settings['phone_number']);
          $is_img = static fn($c) => is_string($c) && (strpos($c, 'http') === 0 || strpos($c, '/') === 0);
          $first_size = null;
          foreach ($sizes as $s) { if (!empty($s['available'])) { $first_size = $s['size']; break; } }
          ?>
          <div class="mt-2 space-y-2" data-nf-actions
               data-product="<?php echo esc_attr(wp_json_encode($cart_product, JSON_UNESCAPED_UNICODE)); ?>"
               data-colors="<?php echo esc_attr(wp_json_encode(array_values($colors), JSON_UNESCAPED_UNICODE)); ?>"
               data-sizes="<?php echo esc_attr(wp_json_encode(array_values($sizes), JSON_UNESCAPED_UNICODE)); ?>"
               data-color-offset="<?php echo (int) $color_offset; ?>"
               data-wa="<?php echo esc_attr($wa_number); ?>">
            <?php if ($colors) : ?>
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[12px] font-semibold text-[#1a1a1a]">Color: <span data-color-label class="text-[#555] font-normal"><?php echo $is_img($colors[0]) ? 'Color 1' : esc_html($colors[0]); ?></span></span>
                </div>
                <div class="flex gap-2 flex-wrap">
                  <?php foreach ($colors as $idx => $cv) : ?>
                    <button type="button" data-color-btn="<?php echo $idx; ?>" class="relative w-8 h-8 overflow-hidden transition-all flex-shrink-0 border-2 <?php echo $idx === 0 ? 'border-[#1a3c2e] shadow-sm' : 'border-[#ddd] hover:border-[#999]'; ?>">
                      <?php if ($is_img($cv)) : ?><img src="<?php echo esc_url($cv); ?>" alt="Color <?php echo $idx + 1; ?>" class="w-full h-full object-cover" /><?php else : ?><span class="block w-full h-full" style="background-color: <?php echo esc_attr($cv); ?>"></span><?php endif; ?>
                    </button>
                  <?php endforeach; ?>
                </div>
              </div>
            <?php endif; ?>

            <?php if ($sizes) : ?>
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[12px] font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                    Size: <span data-size-label class="text-[#555] font-normal"><?php echo esc_html($first_size ?: 'Select'); ?></span>
                    <span data-size-status class="text-[11px] font-semibold px-1.5 py-0.5 border text-green-700 bg-green-50 border-green-200" <?php echo $first_size ? '' : 'hidden'; ?>>Available</span>
                  </span>
                  <button type="button" data-nf-sizechart-open class="flex items-center gap-1.5 text-[13px] text-[#1a3c2e] font-semibold hover:underline"><?php echo nf_icon('ruler', 14); ?>Size Chart</button>
                </div>
                <div class="flex gap-2 flex-wrap">
                  <?php foreach ($sizes as $s) : $sel = $s['size'] === $first_size; $av = !empty($s['available']); ?>
                    <button type="button" data-size-btn="<?php echo esc_attr($s['size']); ?>" <?php echo $av ? '' : 'disabled'; ?>
                      class="min-w-[40px] px-2 py-1.5 text-[12px] font-semibold border rounded transition-all <?php echo $sel ? 'bg-[#1a3c2e] text-white border-[#1a3c2e]' : 'bg-white text-[#1a1a1a] border-[#ddd] hover:border-[#1a3c2e]'; ?> <?php echo $av ? '' : 'opacity-40 line-through cursor-not-allowed'; ?>"><?php echo esc_html($s['size']); ?></button>
                  <?php endforeach; ?>
                </div>
              </div>
            <?php endif; ?>

            <div class="flex items-center gap-2">
              <span class="text-[11px] font-semibold text-[#1a1a1a]">Qty:</span>
              <div class="flex items-center border border-[#ddd] w-fit">
                <button type="button" data-qty-dec class="px-2 py-1 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"><?php echo nf_icon('minus', 11); ?></button>
                <span data-qty class="px-3 py-1 text-[13px] font-semibold text-[#1a1a1a] min-w-[32px] text-center border-x border-[#ddd]">1</span>
                <button type="button" data-qty-inc class="px-2 py-1 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"><?php echo nf_icon('plus', 11); ?></button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button type="button" data-buy-now class="flex items-center justify-center py-2.5 bg-[#1a1a1a] text-white text-[13px] font-bold hover:bg-[#333] transition-colors rounded-sm">অর্ডার করুন</button>
              <a data-wa-link href="<?php echo esc_url($wa_number ? 'https://wa.me/' . $wa_number : 'https://wa.me/'); ?>" target="_blank" rel="noreferrer" class="flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#20bd5a] transition-colors rounded-sm">
                <svg viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              <button type="button" data-add-cart class="flex items-center justify-center py-2.5 border-2 border-[#1a3c2e] text-[#1a3c2e] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1a3c2e] hover:text-white transition-colors rounded-sm">Add to Cart</button>
              <a href="<?php echo esc_attr($tel_number ? 'tel:' . $tel_number : 'tel:'); ?>" class="flex items-center justify-center gap-1.5 py-2.5 bg-[#1a3c2e] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#0f2a1e] transition-colors rounded-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5 shrink-0"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                Call to Order
              </a>
            </div>

            <div class="flex items-stretch justify-between pt-2 border-t border-[#f0f0f0]">
              <div class="flex flex-col items-center gap-1 text-center flex-1 px-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="h-5 w-5 text-[#1a3c2e]"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 14h4"/></svg>
                <p class="text-[10px] font-semibold text-[#222] leading-tight">Cash On Delivery</p>
                <p class="text-[9px] text-[#888] leading-tight">Pay when you get</p>
              </div>
              <div class="w-px bg-[#f0f0f0] self-stretch mx-0.5"></div>
              <div class="flex flex-col items-center gap-1 text-center flex-1 px-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="h-5 w-5 text-[#1a3c2e]"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                <p class="text-[10px] font-semibold text-[#222] leading-tight">Easy Return</p>
                <p class="text-[9px] text-[#888] leading-tight">Within 7 Days</p>
              </div>
              <div class="w-px bg-[#f0f0f0] self-stretch mx-0.5"></div>
              <div class="flex flex-col items-center gap-1 text-center flex-1 px-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="h-5 w-5 text-[#1a3c2e]"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
                <p class="text-[10px] font-semibold text-[#222] leading-tight">Easy Exchange</p>
                <p class="text-[9px] text-[#888] leading-tight">Hassle Free</p>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-2 text-[13px] text-[#777]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5 shrink-0 text-[#1a3c2e]"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>
            ২-৩ কার্যদিবসের মধ্যে ডেলিভারি
          </div>

          <?php if ($product['detail'] !== '' || $product['description'] !== '') : ?>
            <div class="mt-5 border-t border-[#f0f0f0] pt-4">
              <h2 class="text-[15px] font-bold uppercase tracking-wide text-[#1a1a1a] mb-3">Product Details</h2>
              <?php if ($product['detail'] !== '') : ?><p class="text-[14px] text-[#555] leading-relaxed"><?php echo esc_html($product['detail']); ?></p><?php endif; ?>
              <?php if ($product['description'] !== '') : ?>
                <div class="product-description mt-3 text-[14px] md:text-[15px] leading-[1.7] text-[#444]"><?php echo wp_kses($product['description'], $kses_tags); ?></div>
              <?php endif; ?>
            </div>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </section>

  <?php if ($product['video_url'] !== '' && ($embed = nf_video_embed($product['video_url']))) : ?>
    <section class="bg-white px-3 md:px-10 py-6 md:py-12 border-t border-[#f0f0f0]">
      <div class="mx-auto max-w-[900px]">
        <h2 class="text-[15px] md:text-[20px] font-bold uppercase tracking-wide text-[#1a1a1a] mb-4">Product Video</h2>
        <div class="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-md">
          <?php if ($embed[0] === 'iframe') : ?>
            <iframe src="<?php echo esc_url($embed[1]); ?>" title="<?php echo esc_attr($product['name']); ?>" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe>
          <?php else : ?>
            <video src="<?php echo esc_url($embed[1]); ?>" controls playsinline class="absolute inset-0 w-full h-full object-contain">Your browser does not support the video tag.</video>
          <?php endif; ?>
        </div>
      </div>
    </section>
  <?php endif; ?>

  <?php
  $size_rows = [['M', 40, 42, 17, 24.5, 17.5], ['L', 42, 44, 18, 25.5, 18], ['XL', 44, 46, 19, 26, 18], ['XXL', 46, 48, 19.5, 26.5, 19]];
  ?>
  <section class="bg-white border-t border-[#f0f0f0] py-10 md:py-14">
    <div class="mx-auto max-w-[1280px] px-4 md:px-10">
      <h2 class="text-[18px] md:text-[22px] font-bold text-[#1a1a1a] mb-6">Size Chart <span class="text-[14px] font-normal text-[#777]">(Inch)</span></h2>
      <table class="w-full text-[12px] md:text-[14px] border border-[#eee]">
        <thead>
          <tr class="bg-[#1a3c2e] text-white">
            <th class="px-2 py-2 md:px-5 md:py-3 text-left font-semibold">Size</th>
            <?php foreach (['Length', 'Chest', 'Shoulder', 'Sleeve', 'Collar'] as $h) : ?><th class="px-2 py-2 md:px-5 md:py-3 text-center font-semibold"><?php echo $h; ?></th><?php endforeach; ?>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($size_rows as $i => $row) : ?>
            <tr class="<?php echo $i % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f8]'; ?>">
              <td class="px-2 py-2.5 md:px-5 md:py-3.5 font-bold text-[#1a3c2e]"><?php echo $row[0]; ?></td>
              <?php for ($k = 1; $k <= 5; $k++) : ?><td class="px-2 py-2.5 md:px-5 md:py-3.5 text-center text-[#444]"><?php echo $row[$k]; ?></td><?php endfor; ?>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <p class="text-[11px] text-[#999] mt-3">* সব মাপ ইঞ্চিতে। পণ্যভেদে ১ ইঞ্চি পার্থক্য হতে পারে।</p>
    </div>
  </section>

  <!-- size chart modal (opened from the size selector) -->
  <div data-nf-sizechart hidden class="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-[500px] rounded-lg shadow-2xl" data-nf-sizechart-box>
      <div class="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
        <h3 class="text-[16px] font-bold text-[#1a1a1a]">Size Chart (Inch)</h3>
        <button type="button" data-nf-sizechart-close class="text-[#999] hover:text-[#444]"><?php echo nf_icon('x', 20); ?></button>
      </div>
      <div class="overflow-x-hidden">
        <table class="w-full text-[12px]">
          <thead>
            <tr class="bg-[#1a3c2e] text-white">
              <th class="px-2 py-2.5 text-left font-semibold">Size</th>
              <?php foreach (['Length', 'Chest', 'Shoulder', 'Sleeve', 'Collar'] as $h) : ?><th class="px-2 py-2.5 text-center font-semibold"><?php echo $h; ?></th><?php endforeach; ?>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($size_rows as $i => $row) : ?>
              <tr class="<?php echo $i % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f8]'; ?>">
                <td class="px-2 py-2.5 font-bold text-[#1a3c2e]"><?php echo $row[0]; ?></td>
                <?php for ($k = 1; $k <= 5; $k++) : ?><td class="px-2 py-2.5 text-center text-[#444]"><?php echo $row[$k]; ?></td><?php endfor; ?>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <p class="text-[11px] text-[#999] px-5 py-3 border-t border-[#eee]">* সব মাপ ইঞ্চিতে। পণ্যভেদে ১ ইঞ্চি পার্থক্য হতে পারে।</p>
    </div>
  </div>

  <?php if ($product['faqs']) : ?>
    <section class="bg-[#fcfaf7] px-6 py-[80px]" data-nf-faq>
      <div class="mx-auto max-w-[1200px]">
        <div class="text-center mb-10">
          <p class="text-[13px] font-bold uppercase tracking-widest text-[#222]">Learn More</p>
          <h2 class="mt-3 font-heading text-[32px] md:text-[42px] text-[#ac8545]">Frequently Asked Questions</h2>
        </div>
        <div class="mx-auto max-w-[1000px] space-y-4">
          <?php foreach ($product['faqs'] as $i => $faq) : ?>
            <div class="bg-white">
              <button type="button" data-faq-btn="<?php echo $i; ?>" class="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-[#fafafa]">
                <span class="text-[15px] font-bold text-[#222] pr-4 leading-tight"><?php echo esc_html($faq['q'] ?? ''); ?></span>
                <span data-faq-sign class="text-[24px] font-light text-[#222] flex-shrink-0 w-6 text-center"><?php echo $i === 0 ? '−' : '+'; ?></span>
              </button>
              <div data-faq-body="<?php echo $i; ?>" <?php echo $i === 0 ? '' : 'hidden'; ?> class="px-6 pb-6 text-[14px] leading-[1.6] text-[#444] border-t border-[#f0f0f0] pt-4"><?php echo esc_html($faq['a'] ?? ''); ?></div>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    </section>
  <?php endif; ?>

  <?php
  $related = nf_get_products(['category_slug' => $product['category_slug'], 'exclude' => $product['id'], 'limit' => 8]);
  if ($related) : ?>
    <section class="bg-[#f9f9f9] px-3 md:px-10 py-6 md:py-12 border-t border-[#f0f0f0]">
      <div class="mx-auto max-w-[1280px]">
        <div class="mb-3 md:mb-8 text-center">
          <?php if ($product['category_name'] !== '') : ?><p class="section-eyebrow mb-1"><?php echo esc_html($product['category_name']); ?></p><?php endif; ?>
          <h2 class="text-[15px] md:text-[24px] font-bold uppercase tracking-wide text-[#1a1a1a]">আরও পছন্দ হতে পারে</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          <?php foreach ($related as $rp) {
              get_template_part('template-parts/product-card', null, ['product' => $rp, 'priority' => false, 'reviews' => count(nf_review_stats((int) $rp['id']))]);
          } ?>
        </div>
      </div>
    </section>
  <?php endif; ?>

  <?php
  $avg = $review_count ? array_sum(array_column($reviews, 'rating')) / $review_count : 0;
  $recommended = count(array_filter($reviews, static fn($r) => $r['rating'] >= 4));
  $rec_pct = $review_count ? ($recommended / $review_count) * 100 : 0;
  ?>
  <section class="bg-[#f9f9f9] py-10 md:py-16">
    <div class="mx-auto max-w-[1280px] px-4 md:px-10">
      <h2 class="text-[18px] md:text-[26px] font-bold text-[#1a1a1a] mb-6 pb-4 border-b border-[#e5e5e5]">Customer Reviews</h2>
      <div class="grid gap-6 md:grid-cols-[260px_1fr] md:gap-10">
        <div class="space-y-3">
          <div class="bg-white border border-[#e5e5e5] p-5 text-center">
            <p class="text-[52px] font-bold text-[#1a1a1a] leading-none mb-1"><?php echo esc_html(number_format($avg, 1)); ?></p>
            <p class="text-[12px] uppercase tracking-wide text-[#999] mb-2">Average Rating</p>
            <div class="flex justify-center gap-0.5 mb-2">
              <?php for ($i = 0; $i < 5; $i++) { $on = $i < round($avg); echo nf_icon('star', 17, $on ? 'text-amber-400' : 'text-gray-300', 1.5, $on ? '#f59e0b' : 'none'); } ?>
            </div>
            <p class="text-[13px] text-[#555]"><?php echo $review_count; ?> review<?php echo $review_count !== 1 ? 's' : ''; ?></p>
            <p class="text-[13px] text-[#555]"><?php echo esc_html(number_format($rec_pct, 2)); ?>% Recommended</p>
          </div>
          <div class="bg-white border border-[#e5e5e5] p-4 space-y-2.5">
            <?php foreach ([5, 4, 3, 2, 1] as $star) :
              $c = count(array_filter($reviews, static fn($r) => $r['rating'] === $star));
              $pct = $review_count ? ($c / $review_count) * 100 : 0; ?>
              <div class="flex items-center gap-2">
                <span class="text-[12px] text-[#666] w-12 shrink-0 text-right"><?php echo $star; ?> stars</span>
                <div class="flex-1 h-[6px] bg-[#f0f0f0] rounded-full overflow-hidden"><div class="h-full bg-amber-400 rounded-full transition-all duration-500" style="width: <?php echo esc_attr((string) $pct); ?>%"></div></div>
                <span class="text-[12px] text-[#aaa] w-5 text-right shrink-0"><?php echo $c; ?></span>
              </div>
            <?php endforeach; ?>
          </div>
        </div>

        <div class="space-y-4">
          <div class="space-y-3">
            <?php if (!$reviews) : ?>
              <div class="bg-white border border-[#e5e5e5] p-8 text-center"><p class="text-[14px] text-[#aaa]">No reviews yet. Be the first to share your experience!</p></div>
            <?php else : foreach ($reviews as $r) : ?>
              <div class="bg-white border border-[#e5e5e5] p-4">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2.5">
                    <div class="h-8 w-8 bg-[#1a3c2e] text-white flex items-center justify-center font-bold text-[13px] rounded-sm shrink-0"><?php echo esc_html(mb_strtoupper(mb_substr($r['name'], 0, 1))); ?></div>
                    <div>
                      <p class="text-[13px] font-semibold text-[#1a1a1a]"><?php echo esc_html($r['name']); ?></p>
                      <div class="flex gap-0.5 mt-0.5">
                        <?php for ($i = 0; $i < 5; $i++) { $on = $i < $r['rating']; echo nf_icon('star', 10, $on ? 'text-amber-400' : 'text-gray-200', 1.5, $on ? '#f59e0b' : 'none'); } ?>
                      </div>
                    </div>
                  </div>
                  <span class="text-[11px] text-[#bbb] shrink-0 mt-0.5"><?php echo esc_html(gmdate('d M Y', strtotime($r['created_at']))); ?></span>
                </div>
                <p class="text-[13px] text-[#555] leading-relaxed"><?php echo esc_html($r['comment']); ?></p>
              </div>
            <?php endforeach; endif; ?>
          </div>

          <div class="bg-white border border-[#e5e5e5] p-5" data-nf-review-form data-product="<?php echo esc_attr($product['id']); ?>">
            <h3 class="text-[15px] font-bold text-[#1a1a1a] mb-4 pb-3 border-b border-[#f0f0f0]">Submit Your Review</h3>
            <div data-review-success hidden class="py-8 text-center">
              <div class="inline-flex h-12 w-12 items-center justify-center bg-green-50 rounded-sm mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-6 w-6 text-green-600"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <p class="text-[14px] font-semibold text-[#1a1a1a]">Thank you for your review!</p>
              <p class="text-[12px] text-[#999] mt-1">Refreshing page...</p>
            </div>
            <form data-review-form class="space-y-3" novalidate>
              <p data-review-error hidden class="text-[13px] text-red-600 bg-red-50 px-3 py-2 border border-red-100 rounded-sm"></p>
              <div>
                <label class="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-1.5">Rating *</label>
                <div class="flex gap-0.5">
                  <?php for ($s = 1; $s <= 5; $s++) : ?>
                    <button type="button" data-star="<?php echo $s; ?>" class="focus:outline-none p-0.5"><span data-star-icon class="text-gray-300"><?php echo nf_icon('star', 26, '', 1.5); ?></span></button>
                  <?php endfor; ?>
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-1.5">Your Name *</label>
                <input type="text" name="name" placeholder="Enter your name" class="w-full border border-[#ddd] px-3 py-2.5 text-[14px] focus:border-[#1a3c2e] focus:outline-none" required />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-1.5">Your Review *</label>
                <textarea name="comment" placeholder="Share your experience with this product..." rows="3" class="w-full resize-y border border-[#ddd] px-3 py-2.5 text-[14px] focus:border-[#1a3c2e] focus:outline-none" required></textarea>
              </div>
              <button type="submit" data-review-submit class="w-full py-3 bg-[#1a3c2e] text-white text-[12px] font-bold uppercase tracking-widest hover:bg-[#0f2a1e] transition-colors">Submit Review</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
</article>
<?php get_footer();
