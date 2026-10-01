/* Nahian Fashion storefront behaviour: header, menu, search, cart drawer, bottom nav.
 * Vanilla port of the original React Header/BottomNav; cart lives in localStorage("cart"). */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var q = function (name) { return $('[data-nf="' + name + '"]'); };
  var qa = function (name) { return $$('[data-nf="' + name + '"]'); };
  var NFG = window.NF || {};

  var ICONS = {
    bag: '<svg xmlns="http://www.w3.org/2000/svg" width="__S__" height="__S__" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="__C__"><path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
  };
  var bagIcon = function (size, cls) { return ICONS.bag.replace(/__S__/g, size).replace('__C__', cls || ''); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function priceNum(p) { return parseFloat(String(p == null ? '' : p).replace(/[^0-9.]/g, '') || '0') || 0; }
  function home(path) { return (NFG.home || '') + path; }

  /* ───────── state ───────── */
  var pathname = document.body.getAttribute('data-nf-path') || '/';
  var cartItems = [];
  var cartOpen = false, menuOpen = false, searchOpen = false;
  var cartOpenedViaHash = false;
  var allProducts = null, productsLoading = false;
  var pendingRemoveId = null;

  function loadCart() {
    try {
      var saved = localStorage.getItem('cart');
      if (saved) { var p = JSON.parse(saved); if (Array.isArray(p)) { cartItems = p; return; } }
    } catch (e) { /* ignore */ }
    cartItems = [];
  }
  function saveCart() { try { localStorage.setItem('cart', JSON.stringify(cartItems)); } catch (e) { /* ignore */ } }
  function cartCount() { return cartItems.reduce(function (a, i) { return a + (i.quantity || 1); }, 0); }
  function cartTotal() { return cartItems.reduce(function (a, i) { return a + priceNum(i.price) * i.quantity; }, 0); }

  /* ───────── rendering ───────── */
  function renderBadges() {
    var count = cartCount();
    var label = count > 9 ? '9+' : String(count);
    [q('cart-badge'), q('nav-cart-badge')].forEach(function (el) {
      if (!el) return;
      el.textContent = label;
      el.hidden = !(count > 0);
    });
  }

  function renderCart() {
    renderBadges();
    var title = q('cart-title'), body = q('cart-body'), footer = q('cart-footer'), total = q('cart-total');
    if (!title || !body) return;
    title.textContent = 'Your Cart (' + cartCount() + ')';
    if (!cartItems.length) {
      body.innerHTML =
        '<div class="flex h-full flex-col items-center justify-center text-center gap-4">' +
        bagIcon(48, 'text-[#ddd]') +
        '<p class="text-[16px] font-semibold text-[#666]">Your cart is empty</p>' +
        '<a href="' + esc(home('/collections/all')) + '" data-nf="cart-close-link" class="bg-[#1a3c2e] text-white px-6 py-3 text-[14px] font-semibold hover:bg-[#0f2a1e] transition-colors">Start Shopping</a>' +
        '</div>';
      footer.hidden = true;
      return;
    }
    body.innerHTML = '<div class="space-y-4">' + cartItems.map(function (item) {
      var img = item.image
        ? '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" class="h-full w-full object-cover" />'
        : '<div class="h-full w-full flex items-center justify-center">' + bagIcon(20, 'text-[#ccc]') + '</div>';
      return '<div class="flex gap-3 pb-4 border-b border-[#f0f0f0]">' +
        '<div class="h-20 w-20 shrink-0 overflow-hidden bg-[#f5f5f5]">' + img + '</div>' +
        '<div class="flex flex-1 flex-col">' +
        '<div class="flex justify-between gap-2">' +
        '<p class="text-[14px] font-semibold text-[#1a1a1a] leading-tight">' + esc(item.name) + '</p>' +
        '<button type="button" data-cart-remove="' + esc(item.id) + '" class="text-[#ccc] hover:text-red-500 transition-colors shrink-0">' + ICONS.trash + '</button>' +
        '</div>' +
        '<div class="mt-2 flex items-center justify-between">' +
        '<div class="flex items-center border border-[#ddd]">' +
        '<button type="button" data-cart-dec="' + esc(item.id) + '" class="px-2.5 py-1 text-[#666] hover:text-[#222] text-[14px]">−</button>' +
        '<span class="px-3 py-1 text-[14px] font-medium">' + esc(item.quantity) + '</span>' +
        '<button type="button" data-cart-inc="' + esc(item.id) + '" class="px-2.5 py-1 text-[#666] hover:text-[#222] text-[14px]">+</button>' +
        '</div>' +
        '<span class="text-[14px] font-bold text-[#1a1a1a]">৳' + (priceNum(item.price) * item.quantity).toLocaleString() + '</span>' +
        '</div></div></div>';
    }).join('') + '</div>';
    footer.hidden = false;
    total.textContent = '৳' + cartTotal().toLocaleString();
  }

  function syncOverflow() {
    document.body.style.overflow = (menuOpen || searchOpen || cartOpen) ? 'hidden' : 'unset';
  }

  /* ───────── panels ───────── */
  function setMenu(open) {
    menuOpen = open;
    q('menu-panel').hidden = !open;
    q('menu-icon-open').hidden = open;
    q('menu-icon-close').hidden = !open;
    syncOverflow();
  }
  function setSearch(open) {
    searchOpen = open;
    q('search-panel').hidden = !open;
    if (open) {
      ensureProducts();
      setTimeout(function () { var i = q('search-input'); if (i) i.focus(); }, 100);
    } else {
      var inp = q('search-input'); if (inp) inp.value = '';
      renderSearch();
    }
    syncOverflow();
  }
  function setCart(open) {
    cartOpen = open;
    q('cart-panel').hidden = !open;
    if (open) renderCart();
    syncOverflow();
  }
  function openCart() {
    if (!cartOpen) {
      cartOpenedViaHash = true;
      history.pushState({ cartOpen: true }, '', '#cart');
    }
    setCart(true);
  }
  function closeCart() {
    setCart(false);
    if (cartOpenedViaHash) {
      cartOpenedViaHash = false;
      if (window.location.hash === '#cart') history.back();
    } else if (pathname === '/cart') {
      history.back();
    }
  }

  /* ───────── search ───────── */
  function ensureProducts() {
    if (allProducts || productsLoading) return;
    productsLoading = true;
    fetch((NFG.rest || '/wp-json/nf/v1/') + 'products', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (json) { allProducts = (json && json.data) || []; renderSearch(); })
      .catch(function () { allProducts = []; })
      .then(function () { productsLoading = false; });
  }
  function renderSearch() {
    var input = q('search-input'), list = q('search-list'), def = q('search-default');
    if (!input || !list || !def) return;
    var term = input.value.trim();
    if (!term) { list.hidden = true; def.hidden = false; list.innerHTML = ''; return; }
    def.hidden = true; list.hidden = false;
    var lc = term.toLowerCase();
    var results = (allProducts || []).filter(function (p) { return String(p.name).toLowerCase().indexOf(lc) !== -1; });
    if (!results.length) {
      list.innerHTML = '<p class="text-[#999] text-center py-10">"' + esc(term) + '" — No products found</p>';
      return;
    }
    list.innerHTML = '<div class="space-y-3"><p class="text-[11px] font-semibold uppercase tracking-widest text-[#999]">' + results.length + ' products found</p>' +
      results.slice(0, 8).map(function (p) {
        var img = p.media_urls && p.media_urls[0] ? '<img src="' + esc(p.media_urls[0]) + '" alt="' + esc(p.name) + '" class="h-full w-full object-cover" loading="lazy" />' : '';
        return '<a href="' + esc(home('/products/' + p.slug)) + '" data-nf="search-close" class="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors group">' +
          '<div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#f5f5f5]">' + img + '</div>' +
          '<div><p class="text-[14px] font-semibold text-[#222] group-hover:text-[#1a3c2e] transition-colors">' + esc(p.name) + '</p>' +
          '<p class="text-[13px] text-[#1a3c2e] font-bold">৳' + esc(p.price) + '</p></div></a>';
      }).join('') + '</div>';
  }

  /* ───────── confirm modal ───────── */
  function askRemove(id, name) {
    pendingRemoveId = id;
    q('confirm-title').textContent = 'Remove Item?';
    q('confirm-message').textContent = 'Remove "' + name + '" from your cart?';
    q('confirm-modal').hidden = false;
  }
  function closeConfirm() { q('confirm-modal').hidden = true; pendingRemoveId = null; }

  /* ───────── cart mutations ───────── */
  function changeQty(id, delta) {
    cartItems = cartItems.map(function (i) {
      if (String(i.id) !== String(id)) return i;
      var n = Object.assign({}, i);
      n.quantity = delta < 0 ? Math.max(1, i.quantity - 1) : i.quantity + 1;
      return n;
    });
    saveCart(); renderCart();
  }

  /* ───────── init ───────── */
  function init() {
    if (!q('cart-panel')) return;
    loadCart();
    renderBadges();

    var header = document.getElementById('nf-header');
    var onScroll = function () { header.classList.toggle('shadow-md', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    q('menu-toggle').addEventListener('click', function () { setMenu(!menuOpen); });
    qa('menu-close').forEach(function (el) { el.addEventListener('click', function () { setMenu(false); }); });
    q('search-open').addEventListener('click', function () { setSearch(true); });
    qa('search-close').forEach(function (el) { el.addEventListener('click', function () { setSearch(false); }); });
    q('search-input').addEventListener('input', renderSearch);
    q('search-panel').addEventListener('click', function (e) {
      if (e.target === q('search-panel')) setSearch(false);
      var link = e.target.closest && e.target.closest('[data-nf="search-close"]');
      if (link) setSearch(false);
    });
    q('cart-open').addEventListener('click', openCart);
    q('cart-close').addEventListener('click', closeCart);
    q('cart-panel').addEventListener('click', function (e) {
      if (e.target === q('cart-panel')) { closeCart(); return; }
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      var rm = t.closest('[data-cart-remove]');
      if (rm) {
        var id = rm.getAttribute('data-cart-remove');
        var it = cartItems.filter(function (i) { return String(i.id) === id; })[0];
        askRemove(id, it ? it.name : '');
        return;
      }
      var dec = t.closest('[data-cart-dec]'); if (dec) { changeQty(dec.getAttribute('data-cart-dec'), -1); return; }
      var inc = t.closest('[data-cart-inc]'); if (inc) { changeQty(inc.getAttribute('data-cart-inc'), 1); return; }
      if (t.closest('[data-nf="cart-close-link"]')) setCart(false);
    });
    q('confirm-ok').addEventListener('click', function () {
      cartItems = cartItems.filter(function (i) { return String(i.id) !== String(pendingRemoveId); });
      saveCart(); renderCart(); closeConfirm();
    });
    qa('confirm-cancel').forEach(function (el) { el.addEventListener('click', closeConfirm); });

    qa('logo-link').forEach(function (el) {
      el.addEventListener('click', function (e) {
        setMenu(false); setSearch(false); setCart(false);
        if (pathname === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      });
    });

    window.addEventListener('popstate', function () {
      if (cartOpenedViaHash) { cartOpenedViaHash = false; setCart(false); }
    });
    window.addEventListener('search:open', function () { setSearch(true); });

    window.addEventListener('cart:add', function (e) {
      var item = e.detail;
      if (item && item.id) {
        var exists = cartItems.filter(function (i) { return i.id === item.id; })[0];
        cartItems = exists
          ? cartItems.map(function (i) { return i.id === item.id ? Object.assign({}, i, { quantity: (i.quantity || 1) + 1 }) : i; })
          : cartItems.concat([Object.assign({}, item, { quantity: 1 })]);
        saveCart();
        if (!cartOpen) { cartOpenedViaHash = true; history.pushState({ cartOpen: true }, '', '#cart'); }
        setCart(true);
      } else {
        loadCart();
      }
      renderCart();
    });
    window.addEventListener('cart:clear', function () { cartItems = []; setCart(false); renderBadges(); });
    window.addEventListener('storage', function () { loadCart(); renderCart(); });

    if (pathname === '/cart') setCart(true);

    // Footer e-mail link: touch devices open the mail app, desktops open Gmail compose.
    $$('[data-nf-email]').forEach(function (a) {
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) a.setAttribute('href', 'mailto:' + a.getAttribute('data-nf-email'));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
