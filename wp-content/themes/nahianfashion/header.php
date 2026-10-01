<?php
/**
 * Site header: sticky bar, mobile menu, search panel, cart drawer, confirm modal.
 */
defined('ABSPATH') || exit;
$nav_cats = nf_header_categories();
$logo     = nf_logo_url();
$link_cls = 'px-3 py-1.5 text-[14px] font-medium text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors';
$mlink    = 'px-4 py-3 text-[15px] font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors';
?><!doctype html>
<html <?php language_attributes(); ?> style="scroll-behavior: smooth;">
<head>
<meta charset="<?php bloginfo('charset'); ?>" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<?php wp_head(); ?>
</head>
<body <?php body_class('bg-white text-foreground antialiased min-h-screen flex flex-col'); ?> style="font-family: 'Poppins', 'Hind Siliguri', system-ui, sans-serif;" data-nf-path="<?php echo esc_attr(nf_current_path()); ?>">
<?php wp_body_open(); ?>
<?php if (!empty($GLOBALS['nf_bare'])) { return; } ?>

<!-- STICKY HEADER -->
<header id="nf-header" class="sticky top-0 z-[100] w-full transition-all duration-300 bg-[#1a3c2e]">
  <div class="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between px-4 md:px-8 relative">
    <div class="flex items-center gap-3">
      <button type="button" class="md:hidden text-white" data-nf="menu-toggle" aria-label="Menu">
        <span data-nf="menu-icon-open"><?php echo nf_icon('menu', 24); ?></span>
        <span data-nf="menu-icon-close" hidden><?php echo nf_icon('x', 24); ?></span>
      </button>
      <a href="<?php echo esc_url(nf_url('/')); ?>" data-nf="logo-link" class="hidden md:block">
        <img src="<?php echo esc_url($logo); ?>" alt="Nahian Fashion" width="547" height="456" class="h-[40px] w-auto object-contain" />
      </a>
    </div>

    <a href="<?php echo esc_url(nf_url('/')); ?>" data-nf="logo-link" class="md:hidden absolute left-1/2 -translate-x-1/2">
      <img src="<?php echo esc_url($logo); ?>" alt="Nahian Fashion" width="547" height="456" class="h-[34px] w-auto object-contain" />
    </a>

    <nav class="hidden md:flex flex-1 items-center justify-center gap-1">
      <a href="<?php echo esc_url(nf_url('/')); ?>" class="<?php echo $link_cls; ?>">Home</a>
      <?php foreach ($nav_cats as $cat) : ?>
        <a href="<?php echo esc_url(nf_category_url($cat)); ?>" class="<?php echo $link_cls; ?>"><?php echo esc_html($cat->name); ?></a>
      <?php endforeach; ?>
      <a href="<?php echo esc_url(nf_page_url('contact')); ?>" class="<?php echo $link_cls; ?>">Contact</a>
    </nav>

    <div class="flex items-center gap-1 md:gap-2">
      <button type="button" data-nf="search-open" class="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors" aria-label="Search"><?php echo nf_icon('search', 20); ?></button>
      <button type="button" data-nf="cart-open" class="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors" aria-label="Cart">
        <?php echo nf_icon('shopping-bag', 20); ?>
        <span data-nf="cart-badge" hidden class="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none"></span>
      </button>
    </div>
  </div>
</header>

<!-- MOBILE MENU -->
<div data-nf="menu-panel" hidden>
  <div class="fixed inset-0 z-[80] bg-black/50" data-nf="menu-close"></div>
  <nav class="fixed left-0 top-0 bottom-0 z-[110] w-[280px] bg-[#1a3c2e] flex flex-col shadow-2xl overflow-y-auto">
    <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
      <img src="<?php echo esc_url($logo); ?>" alt="Nahian Fashion" width="547" height="456" class="h-[34px] w-auto" />
      <button type="button" data-nf="menu-close" class="text-white/70 hover:text-white"><?php echo nf_icon('x', 22); ?></button>
    </div>
    <div class="flex flex-col p-4 gap-1">
      <a href="<?php echo esc_url(nf_url('/')); ?>" data-nf="menu-close" class="<?php echo $mlink; ?>">Home</a>
      <?php foreach ($nav_cats as $cat) : ?>
        <a href="<?php echo esc_url(nf_category_url($cat)); ?>" data-nf="menu-close" class="<?php echo $mlink; ?>"><?php echo esc_html($cat->name); ?></a>
      <?php endforeach; ?>
      <a href="<?php echo esc_url(nf_url('/collections/all')); ?>" data-nf="menu-close" class="<?php echo $mlink; ?>">All Products</a>
      <a href="<?php echo esc_url(nf_page_url('contact')); ?>" data-nf="menu-close" class="<?php echo $mlink; ?>">Contact</a>
    </div>
  </nav>
</div>

<!-- SEARCH PANEL -->
<div data-nf="search-panel" hidden class="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm">
  <div class="absolute top-0 left-0 right-0 bg-white shadow-xl p-4 md:p-6" data-nf="search-box">
    <div class="mx-auto max-w-[680px]">
      <div class="flex items-center gap-3 border-b-2 border-[#1a3c2e] pb-3">
        <?php echo nf_icon('search', 20, 'text-[#1a3c2e] shrink-0'); ?>
        <input data-nf="search-input" placeholder="Search products..." class="flex-1 text-[18px] text-[#1a1a1a] outline-none bg-transparent placeholder:text-[#aaa]" />
        <button type="button" data-nf="search-close" class="text-[#666] hover:text-[#222]"><?php echo nf_icon('x', 22); ?></button>
      </div>
      <div class="pt-4 max-h-[60vh] overflow-y-auto" data-nf="search-results">
        <div data-nf="search-default">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-[#999] mb-3">Popular Categories</p>
          <div class="flex flex-wrap gap-2">
            <?php foreach ($nav_cats as $cat) : ?>
              <a href="<?php echo esc_url(nf_category_url($cat)); ?>" data-nf="search-close" class="px-4 py-2 bg-[#f5f5f5] hover:bg-[#1a3c2e] hover:text-white rounded-full text-[13px] font-medium text-[#444] transition-colors"><?php echo esc_html($cat->name); ?></a>
            <?php endforeach; ?>
          </div>
        </div>
        <div data-nf="search-list" hidden></div>
      </div>
    </div>
  </div>
</div>

<!-- CART DRAWER -->
<div data-nf="cart-panel" hidden class="fixed inset-0 z-[120] bg-black/50">
  <aside class="ml-auto flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl" data-nf="cart-aside">
    <div class="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
      <h2 class="text-[18px] font-bold text-[#1a1a1a]" data-nf="cart-title">Your Cart (0)</h2>
      <button type="button" data-nf="cart-close" class="text-[#666] hover:text-[#222]"><?php echo nf_icon('x', 22); ?></button>
    </div>
    <div class="flex-1 overflow-y-auto px-5 py-4" data-nf="cart-body"></div>
    <div hidden class="border-t border-[#eee] bg-white p-5" data-nf="cart-footer">
      <div class="flex justify-between items-center mb-4">
        <span class="text-[15px] font-semibold text-[#1a1a1a]">Total</span>
        <span class="text-[20px] font-bold text-[#1a3c2e]" data-nf="cart-total">৳0</span>
      </div>
      <a href="<?php echo esc_url(nf_url('/checkout')); ?>" data-nf="cart-close-link" class="flex w-full items-center justify-center bg-[#1a3c2e] py-4 text-[15px] font-bold uppercase tracking-wider text-white hover:bg-[#0f2a1e] transition-colors">Checkout</a>
    </div>
  </aside>
</div>

<!-- CONFIRM MODAL -->
<div data-nf="confirm-modal" hidden class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
    <div class="p-6">
      <div class="flex justify-between items-start mb-4">
        <div class="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 text-red-500"><?php echo nf_icon('trash-2', 24); ?></div>
        <button type="button" data-nf="confirm-cancel" class="text-[#999] hover:text-[#555] transition-colors"><?php echo nf_icon('x', 20); ?></button>
      </div>
      <h3 class="text-[20px] font-bold text-[#222] mb-2" data-nf="confirm-title"></h3>
      <p class="text-[#666] text-[15px] leading-relaxed mb-8" data-nf="confirm-message"></p>
      <div class="flex gap-3">
        <button type="button" data-nf="confirm-cancel" class="flex-1 py-3 px-4 rounded-xl border border-[#ddd] text-[#555] font-bold text-[14px] uppercase tracking-wider hover:bg-[#f5f5f5] transition-colors">Cancel</button>
        <button type="button" data-nf="confirm-ok" class="flex-1 py-3 px-4 rounded-xl text-white font-bold text-[14px] uppercase tracking-wider transition-all shadow-lg bg-red-500 hover:bg-red-600 shadow-red-500/20">Confirm</button>
      </div>
    </div>
  </div>
</div>

<main class="flex-1 w-full pb-[60px] md:pb-0">
