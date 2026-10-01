/* Storefront page behaviour: product cards, hero slider, collection filters/sort, product page
 * (gallery, options, add to cart, buy now, FAQ, reviews) and the review video lightbox. */
(function () {
  'use strict';

  var NFG = window.NF || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var home = function (p) { return (NFG.home || '') + p; };
  var swap = function (el, add, remove) {
    if (!el) return;
    String(remove || '').split(' ').filter(Boolean).forEach(function (c) { el.classList.remove(c); });
    String(add || '').split(' ').filter(Boolean).forEach(function (c) { el.classList.add(c); });
  };

  function parsePrice(value) {
    var stripped = String(value == null ? '' : value).replace(/[^0-9.]/g, '');
    var parts = stripped.split('.');
    var cleaned = parts.length > 1 ? parts.slice(0, -1).join('') + '.' + parts[parts.length - 1] : stripped;
    var n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
  }
  function uuid() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  function pushAddToCart(p, qty) {
    var price = parsePrice(p.price);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'add_to_cart', event_id: uuid(),
      ecommerce: { currency: 'BDT', value: price * qty, items: [{ item_id: p.id, item_name: p.name, item_brand: 'Nahian Fashion', item_category: p.category || 'Fashion', price: price, quantity: qty }] }
    });
  }

  /* ───────── product card: "অর্ডার করুন" adds one item and goes straight to checkout ───────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-nf-card-add]');
    if (!btn || btn.disabled) return;
    e.preventDefault();
    var d = btn.dataset;
    var existing = [];
    try { existing = JSON.parse(localStorage.getItem('cart') || '[]'); } catch (err) { existing = []; }
    var idx = existing.findIndex(function (i) { return i.id === d.id; });
    if (idx > -1) {
      existing[idx] = Object.assign({}, existing[idx], { quantity: (existing[idx].quantity || 1) + 1 });
    } else {
      existing.push({ id: d.id, name: d.name, price: d.price, image: d.image, detail: d.detail, originalPrice: d.original, discount: d.discount, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent('cart:add'));
    pushAddToCart({ id: d.id, name: d.name, price: d.price, category: d.category }, 1);
    window.location.href = home('/checkout');
  });

  /* ───────── hero slider ───────── */
  function initHero() {
    var root = $('[data-nf-hero]');
    if (!root) return;
    var slides = $$('[data-hero-slide]', root), dots = $$('[data-hero-dot]', root), link = $('[data-hero-link]', root);
    var n = slides.length, cur = 0, timer = null, startX = null;
    function show(i) {
      cur = (i + n) % n;
      slides.forEach(function (s, k) {
        if (k === cur) swap(s, 'opacity-100 z-10', 'opacity-0 z-0'); else swap(s, 'opacity-0 z-0', 'opacity-100 z-10');
      });
      dots.forEach(function (d, k) {
        if (k === cur) swap(d, 'bg-white w-6 h-2.5', 'bg-white/50 w-2.5 h-2.5 hover:bg-white/75'); else swap(d, 'bg-white/50 w-2.5 h-2.5 hover:bg-white/75', 'bg-white w-6 h-2.5');
      });
      if (link) link.setAttribute('href', slides[cur].getAttribute('data-link'));
    }
    function reset() { if (timer) clearInterval(timer); if (n > 1) timer = setInterval(function () { show(cur + 1); }, 4500); }
    if (n > 1) {
      reset();
      var prev = $('[data-hero-prev]', root), next = $('[data-hero-next]', root);
      if (prev) prev.addEventListener('click', function () { show(cur - 1); reset(); });
      if (next) next.addEventListener('click', function () { show(cur + 1); reset(); });
      dots.forEach(function (d) { d.addEventListener('click', function () { show(parseInt(d.getAttribute('data-hero-dot'), 10)); reset(); }); });
      root.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      root.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { diff > 0 ? show(cur + 1) : show(cur - 1); reset(); }
        startX = null;
      });
    }
  }

  /* ───────── collection page: filters, sort, mobile drawer ───────── */
  function initCollection() {
    var panels = $$('[data-nf-filter]');
    if (!panels.length && !$('[data-nf-sort]')) return;
    panels.forEach(function (panel) {
      var body = $('[data-nf-filter-body]', panel), chev = $('[data-nf-filter-chevron]', panel);
      $('[data-nf-filter-toggle]', panel).addEventListener('click', function () {
        body.hidden = !body.hidden;
        chev.classList.toggle('rotate-180', !body.hidden);
      });
      $$('input[type=checkbox]', panel).forEach(function (cb) {
        cb.addEventListener('change', function () {
          var slugs = $$('input[type=checkbox]:checked', panel).map(function (c) { return c.getAttribute('data-slug'); });
          window.location.href = home('/collections/' + (slugs.length ? slugs.join('+') : 'all'));
        });
      });
    });
    var drawer = $('[data-nf-filters-drawer]');
    var openBtn = $('[data-nf-filters-open]');
    if (drawer && openBtn) {
      openBtn.addEventListener('click', function () { drawer.hidden = false; });
      $$('[data-nf-filters-close]', drawer).forEach(function (b) { b.addEventListener('click', function () { drawer.hidden = true; }); });
    }
    var grids = $$('[data-nf-grid]');
    grids.forEach(function (g) { $$('[data-nf-card]', g).forEach(function (c, i) { c.__order = i; }); });
    var selects = $$('[data-nf-sort]');
    selects.forEach(function (sel) {
      sel.addEventListener('change', function () {
        var mode = sel.value;
        selects.forEach(function (s) { s.value = mode; });
        grids.forEach(function (g) {
          var cards = $$('[data-nf-card]', g);
          cards.sort(function (a, b) {
            var pa = parseFloat(a.getAttribute('data-price-num')), pb = parseFloat(b.getAttribute('data-price-num'));
            if (mode === 'price-asc') return pa - pb;
            if (mode === 'price-desc') return pb - pa;
            return a.__order - b.__order;
          });
          cards.forEach(function (c) { g.appendChild(c); });
        });
      });
    });
  }

  /* ───────── product page ───────── */
  function initGallery() {
    var root = $('[data-nf-gallery]');
    if (!root) return;
    var n = parseInt(root.getAttribute('data-count'), 10) || 0, cur = 0;
    var track = $('[data-gallery-track]', root), thumbs = $$('[data-gallery-thumb]', root), dots = $$('[data-gallery-dot]', root);
    function go(i) {
      cur = (i + n) % n;
      track.style.transform = 'translateX(-' + (cur * 100) + '%)';
      thumbs.forEach(function (t, k) {
        if (k === cur) swap(t, 'border-[#1a3c2e]', 'border-[#e5e5e5] hover:border-[#aaa]'); else swap(t, 'border-[#e5e5e5] hover:border-[#aaa]', 'border-[#1a3c2e]');
      });
      dots.forEach(function (d, k) {
        if (k === cur) swap(d, 'w-5 bg-white', 'w-1.5 bg-white/50'); else swap(d, 'w-1.5 bg-white/50', 'w-5 bg-white');
      });
    }
    thumbs.forEach(function (t) { t.addEventListener('click', function () { go(parseInt(t.getAttribute('data-gallery-thumb'), 10)); }); });
    dots.forEach(function (d) { d.addEventListener('click', function () { go(parseInt(d.getAttribute('data-gallery-dot'), 10)); }); });
    var prev = $('[data-gallery-prev]', root), next = $('[data-gallery-next]', root);
    if (prev) prev.addEventListener('click', function (e) { e.preventDefault(); go(cur - 1); });
    if (next) next.addEventListener('click', function (e) { e.preventDefault(); go(cur + 1); });
    var wish = $('[data-gallery-wish]', root), on = false;
    if (wish) wish.addEventListener('click', function () {
      on = !on;
      $('[data-wish-off]', wish).hidden = on;
      $('[data-wish-on]', wish).hidden = !on;
    });
    window.addEventListener('gallery:goto', function (e) {
      var idx = e.detail;
      if (typeof idx === 'number' && idx >= 0 && idx < n) go(idx);
    });
  }

  function initActions() {
    var root = $('[data-nf-actions]');
    if (!root) return;
    var product = JSON.parse(root.getAttribute('data-product'));
    var colors = JSON.parse(root.getAttribute('data-colors') || '[]');
    var sizes = JSON.parse(root.getAttribute('data-sizes') || '[]');
    var offset = parseInt(root.getAttribute('data-color-offset'), 10) || 0;
    var wa = root.getAttribute('data-wa') || '';
    var isImg = function (c) { return typeof c === 'string' && (c.indexOf('http') === 0 || c.indexOf('/') === 0); };
    var urlIdx = []; colors.forEach(function (c, i) { if (isImg(c)) urlIdx.push(i); });

    var qty = 1;
    var colorIdx = colors.length ? 0 : null;
    var firstAvail = sizes.filter(function (s) { return s.available; })[0];
    var size = firstAvail ? firstAvail.size : null;
    var qtyEl = $('[data-qty]', root), waLink = $('[data-wa-link]', root);

    function refresh() {
      qtyEl.textContent = qty;
      var colorLabel = $('[data-color-label]', root);
      if (colorLabel) colorLabel.textContent = colorIdx !== null ? (isImg(colors[colorIdx]) ? 'Color ' + (colorIdx + 1) : colors[colorIdx]) : 'Select';
      $$('[data-color-btn]', root).forEach(function (b) {
        var on = parseInt(b.getAttribute('data-color-btn'), 10) === colorIdx;
        if (on) swap(b, 'border-[#1a3c2e] shadow-sm', 'border-[#ddd] hover:border-[#999]'); else swap(b, 'border-[#ddd] hover:border-[#999]', 'border-[#1a3c2e] shadow-sm');
      });
      var sizeLabel = $('[data-size-label]', root), status = $('[data-size-status]', root);
      if (sizeLabel) sizeLabel.textContent = size || 'Select';
      if (status) {
        status.hidden = !size;
        if (size) {
          var rec = sizes.filter(function (s) { return s.size === size; })[0];
          var avail = rec ? rec.available : true;
          status.textContent = avail ? 'Available' : 'Stock Out';
          swap(status, avail ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200', avail ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200');
        }
      }
      $$('[data-size-btn]', root).forEach(function (b) {
        var on = b.getAttribute('data-size-btn') === size;
        if (on) swap(b, 'bg-[#1a3c2e] text-white border-[#1a3c2e]', 'bg-white text-[#1a1a1a] border-[#ddd] hover:border-[#1a3c2e]'); else swap(b, 'bg-white text-[#1a1a1a] border-[#ddd] hover:border-[#1a3c2e]', 'bg-[#1a3c2e] text-white border-[#1a3c2e]');
      });
      var msg = encodeURIComponent('হ্যালো! আমি অর্ডার করতে চাই:\n\nপণ্য: ' + product.name + '\nপরিমাণ: ' + qty + '\n' +
        (colorIdx !== null ? 'রং: Color ' + (colorIdx + 1) + '\n' : '') + (size ? 'সাইজ: ' + size + '\n' : '') + 'মূল্য: ' + product.price);
      waLink.setAttribute('href', wa ? 'https://wa.me/' + wa + '?text=' + msg : 'https://wa.me/?text=' + msg);
    }
    function meta() {
      return {
        selectedSize: size || undefined,
        selectedColorIdx: colorIdx !== null ? colorIdx : undefined,
        availableSizes: sizes.length ? sizes : undefined,
        availableColors: colors.length ? colors : undefined
      };
    }

    $$('[data-color-btn]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        colorIdx = parseInt(b.getAttribute('data-color-btn'), 10);
        var u = urlIdx.indexOf(colorIdx);
        if (u !== -1) window.dispatchEvent(new CustomEvent('gallery:goto', { detail: offset + u }));
        refresh();
      });
    });
    $$('[data-size-btn]', root).forEach(function (b) {
      b.addEventListener('click', function () { if (!b.disabled) { size = b.getAttribute('data-size-btn'); refresh(); } });
    });
    $('[data-qty-dec]', root).addEventListener('click', function () { qty = Math.max(1, qty - 1); refresh(); });
    $('[data-qty-inc]', root).addEventListener('click', function () { qty += 1; refresh(); });

    $('[data-add-cart]', root).addEventListener('click', function () {
      window.dispatchEvent(new CustomEvent('cart:add', { detail: Object.assign({}, product, meta(), { quantity: qty }) }));
      pushAddToCart(product, qty);
    });
    $('[data-buy-now]', root).addEventListener('click', function () {
      localStorage.setItem('sv_buy_now_item', JSON.stringify(Object.assign({}, product, { quantity: qty }, meta())));
      window.location.href = home('/checkout?buyNow=' + encodeURIComponent(product.id));
    });
    refresh();

    var modal = $('[data-nf-sizechart]');
    var open = $('[data-nf-sizechart-open]', root);
    if (modal && open) {
      open.addEventListener('click', function () { modal.hidden = false; });
      modal.addEventListener('click', function (e) { if (e.target === modal) modal.hidden = true; });
      $('[data-nf-sizechart-close]', modal).addEventListener('click', function () { modal.hidden = true; });
    }
  }

  function initFaq() {
    var root = $('[data-nf-faq]');
    if (!root) return;
    var open = 0;
    function render() {
      $$('[data-faq-body]', root).forEach(function (b) { b.hidden = parseInt(b.getAttribute('data-faq-body'), 10) !== open; });
      $$('[data-faq-btn]', root).forEach(function (b) {
        $('[data-faq-sign]', b).textContent = parseInt(b.getAttribute('data-faq-btn'), 10) === open ? '−' : '+';
      });
    }
    $$('[data-faq-btn]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(b.getAttribute('data-faq-btn'), 10);
        open = open === i ? -1 : i;
        render();
      });
    });
  }

  function initReviewForm() {
    var box = $('[data-nf-review-form]');
    if (!box) return;
    var form = $('[data-review-form]', box), err = $('[data-review-error]', box), btn = $('[data-review-submit]', box);
    var stars = $$('[data-star]', box), rating = 0, hover = 0;
    function paint() {
      var v = hover || rating;
      stars.forEach(function (s) {
        var k = parseInt(s.getAttribute('data-star'), 10), on = v >= k;
        var icon = $('[data-star-icon]', s), svg = $('svg', icon);
        icon.className = on ? 'text-amber-400' : 'text-gray-300';
        svg.setAttribute('fill', on ? '#f59e0b' : 'none');
      });
    }
    stars.forEach(function (s) {
      var k = parseInt(s.getAttribute('data-star'), 10);
      s.addEventListener('click', function () { rating = k; paint(); });
      s.addEventListener('mouseenter', function () { hover = k; paint(); });
      s.addEventListener('mouseleave', function () { hover = 0; paint(); });
    });
    function fail(m) { err.textContent = m; err.hidden = false; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim(), comment = form.elements.comment.value.trim();
      if (rating === 0) return fail('Please select a rating.');
      if (!name || !comment) return fail('Please fill in all fields.');
      btn.disabled = true; btn.textContent = 'Submitting...'; btn.classList.add('opacity-70', 'cursor-wait'); err.hidden = true;
      fetch((NFG.rest || '/wp-json/nf/v1/') + 'reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: box.getAttribute('data-product'), name: name, rating: rating, comment: comment })
      }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          btn.disabled = false; btn.textContent = 'Submit Review'; btn.classList.remove('opacity-70', 'cursor-wait');
          if (!res.ok) return fail(res.d.error || 'Failed to submit. Please try again.');
          form.hidden = true; $('[data-review-success]', box).hidden = false;
          setTimeout(function () { window.location.reload(); }, 2200);
        })
        .catch(function () { btn.disabled = false; btn.textContent = 'Submit Review'; btn.classList.remove('opacity-70', 'cursor-wait'); fail('Failed to submit. Please try again.'); });
    });
  }

  /* ───────── customer review video lightbox ───────── */
  function initVideoLightbox() {
    var modal = $('[data-nf-video-modal]');
    if (!modal) return;
    var slot = $('[data-nf-video-slot]', modal);
    function embed(url) {
      var m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      return m ? 'https://www.youtube.com/embed/' + m[1] + '?autoplay=1' : url;
    }
    function close() { modal.hidden = true; slot.innerHTML = ''; }
    $$('[data-nf-video]').forEach(function (b) {
      b.addEventListener('click', function () {
        var url = b.getAttribute('data-nf-video');
        slot.innerHTML = /\.(mp4|webm|ogg)$/i.test(url)
          ? '<video autoplay controls class="h-full w-full"></video>'
          : '<iframe allow="autoplay; encrypted-media" allowfullscreen class="h-full w-full border-0"></iframe>';
        var el = slot.firstChild; el.setAttribute('src', /\.(mp4|webm|ogg)$/i.test(url) ? url : embed(url));
        modal.hidden = false;
      });
    });
    $('[data-nf-video-close]', modal).addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  }

  function init() {
    initHero(); initCollection(); initGallery(); initActions(); initFaq(); initReviewForm(); initVideoLightbox();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
