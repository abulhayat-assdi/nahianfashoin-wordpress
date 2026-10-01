<?php
/**
 * Site footer + mobile bottom navigation.
 */
defined('ABSPATH') || exit;

if (!empty($GLOBALS['nf_bare'])) {
    wp_footer();
    echo "</body>\n</html>";
    return;
}

$s        = nf_settings();
$config   = nf_footer_config();
$logo     = nf_logo_url();
$shop     = nf_categories();
$support  = nf_support_pages();
$tagline  = $s['site_tagline'] ?: 'Premium quality panjabi and fashion for the modern man.';
$icon_cls = 'flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#1a3c2e] transition-colors';
$col_h    = 'text-[13px] font-semibold uppercase tracking-widest text-gray-400 mb-4';
$col_a    = 'block text-[14px] text-gray-400 hover:text-white transition-colors';

$other_columns = array_values(array_filter($config['columns'], static function ($col) {
    $h = strtolower((string) ($col['heading'] ?? ''));
    return !in_array($h, ['shop', 'support', 'blog', 'learn'], true);
}));
$other = $other_columns[0] ?? null;

$path          = nf_current_path();
$is_home       = $path === '/';
$is_menu       = !$is_home && strpos($path, '/collections') === 0;
$is_cart       = $path === '/cart';
$is_account    = strpos($path, '/account') === 0;
$nav_item      = 'relative flex flex-col items-center justify-center gap-0.5 py-2 transition-colors';
$nav_on        = 'text-white';
$nav_off       = 'text-white/55 hover:text-white/80';
$dot           = '<span class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"></span>';
?>
</main>

<footer class="bg-[#1a1a1a] text-white">
  <div class="mx-auto max-w-[1280px] px-6 md:px-10 py-12 md:py-16">
    <div class="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">

      <div>
        <div class="mb-4"><img src="<?php echo esc_url($logo); ?>" alt="Nahian Fashion" class="h-10 w-auto" /></div>
        <p class="text-[13px] text-gray-400 leading-relaxed max-w-[240px]"><?php echo esc_html($tagline); ?></p>
        <div class="mt-6 flex items-center gap-3 flex-wrap">
          <?php if ($s['facebook_url']) : ?>
            <a href="<?php echo esc_url(nf_absolute_url($s['facebook_url'])); ?>" target="_blank" rel="noopener noreferrer" class="<?php echo $icon_cls; ?>" title="Facebook"><svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
          <?php endif; ?>
          <?php if ($s['instagram_url']) : ?>
            <a href="<?php echo esc_url(nf_absolute_url($s['instagram_url'])); ?>" target="_blank" rel="noopener noreferrer" class="<?php echo $icon_cls; ?>" title="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke-width="2.5"/></svg></a>
          <?php endif; ?>
          <?php if ($s['whatsapp_number']) : ?>
            <a href="<?php echo esc_url(nf_whatsapp_url($s['whatsapp_number'])); ?>" target="_blank" rel="noopener noreferrer" class="<?php echo $icon_cls; ?>" title="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4"><path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.065-.301-.149-1.266-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.098-.202.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.36z"/><path d="M20.52 3.449A11.964 11.964 0 0 0 12 0C5.383 0 0 5.383 0 12c0 2.125.553 4.195 1.604 6.01L0 24l6.14-1.604A11.97 11.97 0 0 0 12 24c6.617 0 12-5.383 12-12 0-3.205-1.248-6.22-3.48-8.551zM12 21.986c-1.782 0-3.527-.48-5.05-1.38l-.36-.214-3.75.98 1.002-3.656-.235-.374A9.972 9.972 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg></a>
          <?php endif; ?>
          <?php if ($s['phone_number']) : ?>
            <a href="<?php echo esc_url('tel:' . $s['phone_number']); ?>" class="<?php echo $icon_cls; ?>" title="Call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>
          <?php endif; ?>
          <?php if ($s['contact_email']) : ?>
            <a href="<?php echo esc_url('https://mail.google.com/mail/?view=cm&to=' . rawurlencode($s['contact_email'])); ?>" data-nf-email="<?php echo esc_attr($s['contact_email']); ?>" target="_blank" rel="noopener noreferrer" class="transition-all duration-200 hover:opacity-50 hover:scale-110"><span class="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#1a3c2e] transition-colors cursor-pointer" title="Email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span></a>
          <?php endif; ?>
        </div>
      </div>

      <?php if ($other) :
          $is_account_col = strtolower((string) ($other['heading'] ?? '')) === 'my account'; ?>
        <div>
          <h3 class="<?php echo $col_h; ?>"><?php echo esc_html($other['heading']); ?></h3>
          <div class="space-y-3">
            <?php foreach (($other['links'] ?? []) as $link) :
                $label = (string) ($link['label'] ?? '');
                if ($label === '') { continue; }
                $slug = nf_slugify($label);
                $href = '/pages/' . $slug;
                if ($is_account_col) {
                    if ($slug === 'account' || $slug === 'orders') { $href = '/account-order'; }
                    elseif ($slug === 'addresses' || $slug === 'address') { $href = '/account-address'; }
                    else { $href = '/account-' . $slug; }
                } elseif ($slug === 'home') {
                    $href = '/';
                } ?>
              <a href="<?php echo esc_url(nf_url($href)); ?>" class="<?php echo $col_a; ?>"><?php echo esc_html($label); ?></a>
            <?php endforeach; ?>
          </div>
        </div>
      <?php endif; ?>

      <div>
        <h3 class="<?php echo $col_h; ?>">Shop</h3>
        <div class="space-y-3">
          <?php if (!$shop) : ?>
            <p class="text-[13px] text-gray-600 italic">No categories added yet.</p>
          <?php else : foreach ($shop as $cat) : ?>
            <a href="<?php echo esc_url(nf_category_url($cat)); ?>" class="<?php echo $col_a; ?>"><?php echo esc_html($cat->name); ?></a>
          <?php endforeach; endif; ?>
        </div>
      </div>

      <div>
        <h3 class="<?php echo $col_h; ?>">Support</h3>
        <div class="space-y-3">
          <?php if (!$support) : ?>
            <p class="text-[13px] text-gray-600 italic">No support pages added yet.</p>
          <?php else : foreach ($support as $page) : ?>
            <a href="<?php echo esc_url(nf_page_url($page->post_name)); ?>" class="<?php echo $col_a; ?>"><?php echo esc_html(get_the_title($page)); ?></a>
          <?php endforeach; endif; ?>
        </div>
      </div>
    </div>
  </div>

  <div class="border-t border-white/10">
    <div class="mx-auto max-w-[1280px] px-6 md:px-10 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
      <p class="text-[12px] text-gray-500">© <?php echo esc_html(gmdate('Y')); ?> Nahian Fashion. All Rights Reserved.</p>
      <div class="flex items-center gap-4">
        <a href="<?php echo esc_url(nf_page_url(nf_slugify($config['privacy']))); ?>" class="text-[12px] text-gray-500 hover:text-white transition-colors"><?php echo esc_html($config['privacy']); ?></a>
        <span class="text-gray-700">|</span>
        <a href="<?php echo esc_url(nf_page_url(nf_slugify($config['terms']))); ?>" class="text-[12px] text-gray-500 hover:text-white transition-colors"><?php echo esc_html($config['terms']); ?></a>
      </div>
    </div>
  </div>
</footer>

<!-- MOBILE BOTTOM NAV -->
<nav class="fixed bottom-0 left-0 right-0 z-[90] md:hidden bg-[#1a3c2e] border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
  <div class="grid grid-cols-5 items-end">
    <a href="<?php echo esc_url(nf_url('/collections/all')); ?>" class="<?php echo $nav_item . ' ' . ($is_menu ? $nav_on : $nav_off); ?>">
      <?php if ($is_menu) { echo $dot; } ?>
      <?php echo nf_icon('grid-2x2', 22, '', $is_menu ? 2 : 1.8); ?>
      <span class="text-[9px] font-medium leading-none">Menu</span>
    </a>
    <a href="<?php echo esc_url(nf_url('/cart')); ?>" class="<?php echo $nav_item . ' ' . ($is_cart ? $nav_on : $nav_off); ?>">
      <?php if ($is_cart) { echo $dot; } ?>
      <div class="relative">
        <?php echo nf_icon('shopping-bag', 22, '', $is_cart ? 2 : 1.8); ?>
        <span data-nf="nav-cart-badge" hidden class="absolute -top-1.5 -right-1.5 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none"></span>
      </div>
      <span class="text-[9px] font-medium leading-none">Cart</span>
    </a>
    <a href="<?php echo esc_url(nf_url('/')); ?>" class="relative flex flex-col items-center justify-end gap-0.5 pb-1.5 transition-colors">
      <div class="-mt-4 flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg border-2 transition-all <?php echo $is_home ? 'bg-white border-white text-[#1a3c2e]' : 'bg-[#245238] border-white/30 text-white hover:bg-[#2d6347]'; ?>">
        <?php echo nf_icon('home', 22, '', $is_home ? 2.2 : 1.8); ?>
      </div>
      <span class="text-[9px] font-medium leading-none <?php echo $is_home ? 'text-white' : 'text-white/55'; ?>">Home</span>
    </a>
    <a href="<?php echo esc_url(nf_whatsapp_url($s['whatsapp_number'])); ?>" target="_blank" rel="noopener noreferrer" class="<?php echo $nav_item . ' text-white/55 hover:text-white/80'; ?>">
      <svg viewBox="0 0 448 512" class="w-[22px] h-[22px]" fill="currentColor" aria-hidden="true"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L32 503l139.7-36.6c32.7 17.7 69.2 27 106.7 27 122.4 0 222-99.6 222-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-82.8 21.7 22.1-80.7-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
      <span class="text-[9px] font-medium leading-none">WhatsApp</span>
    </a>
    <a href="<?php echo esc_url(nf_url('/account-order')); ?>" class="<?php echo $nav_item . ' ' . ($is_account ? $nav_on : $nav_off); ?>">
      <?php if ($is_account) { echo $dot; } ?>
      <?php echo nf_icon('user', 22, '', $is_account ? 2 : 1.8); ?>
      <span class="text-[9px] font-medium leading-none">Account</span>
    </a>
  </div>
</nav>

<?php wp_footer(); ?>
</body>
</html>
