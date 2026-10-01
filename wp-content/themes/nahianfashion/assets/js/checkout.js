/* Checkout page: vanilla port of the original React checkout (cart from localStorage, coupon, delivery form,
 * draft (abandoned-checkout) tracking and order placement through the nf/v1 REST API). */
(function () {
  'use strict';

  var root = document.getElementById('nf-checkout');
  if (!root) return;
  var CFG = JSON.parse(root.getAttribute('data-config'));
  var ICONS = CFG.icons || {};
  var NFG = window.NF || {};

  function icon(name, size, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' + (cls || '') + '" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(p) { return parseFloat(String(p == null ? '' : p).replace(/[^0-9.]/g, '')); }
  function money(n) { return Number(n).toLocaleString(); }
  function uuid() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }

  var SHIPPING_OPTIONS = [
    { value: 'inside', label: 'ঢাকার ভিতরে', charge: 70 },
    { value: 'outside', label: 'ঢাকার বাইরে', charge: 120 }
  ];
  var params = new URLSearchParams(window.location.search);
  var buyNowId = params.get('buyNow');

  var state = {
    cartItems: [], itemSelections: {}, selectionErrors: {},
    appliedCoupon: null, couponError: '', couponBusy: false, couponInput: '',
    form: { name: '', phone: '', address: '', shipping_zone: 'outside', shipping_method: 'Cash on Delivery' },
    shippingCharge: 120, placing: false, orderError: '', phoneError: false, confirm: null
  };
  var draftSession = '';
  var isPlacing = false;

  /* ───────── draft tracking ───────── */
  try {
    draftSession = localStorage.getItem('sv_draft_session') || '';
    if (!draftSession) { draftSession = uuid(); localStorage.setItem('sv_draft_session', draftSession); }
  } catch (e) { draftSession = uuid(); }

  var draftTimer = null;
  function scheduleDraft() { clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 1500); }
  function saveDraft() {
    if (isPlacing || !draftSession) return;
    var f = state.form;
    if (!f.name && !f.phone && !f.address) return;
    fetch(CFG.rest + 'orders/draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': CFG.nonce }, credentials: 'same-origin',
      body: JSON.stringify({
        sessionId: draftSession, name: f.name || undefined, phone: f.phone || undefined, address: f.address || undefined,
        shippingZone: f.shipping_zone,
        items: state.cartItems.map(function (i) { return { id: i.id, name: i.name, price: i.price, image: i.image, quantity: i.quantity }; })
      })
    }).catch(function () { /* fire-and-forget */ });
  }

  /* ───────── derived values ───────── */
  function totals() {
    var subtotal = 0, original = 0;
    state.cartItems.forEach(function (it) {
      var p = num(it.price), o = it.originalPrice ? num(it.originalPrice) : 0;
      subtotal += p * it.quantity;
      original += (o > p ? o : p) * it.quantity;
    });
    var productDiscount = original - subtotal;
    var couponDiscount = state.appliedCoupon ? state.appliedCoupon.discount : 0;
    return { subtotal: subtotal, original: original, productDiscount: productDiscount, couponDiscount: couponDiscount, grand: subtotal - couponDiscount + state.shippingCharge };
  }

  /* ───────── left panel (order, selections, coupon, summary) ───────── */
  function itemRowsMobile() {
    if (!state.cartItems.length) {
      return '<div class="py-16 text-center text-[#999]">আপনার কার্ট খালি। <a href="' + CFG.home + '/" class="text-[#1a3c2e] underline ml-1">কেনাকাটা চালিয়ে যান</a></div>';
    }
    return '<div class="space-y-3">' + state.cartItems.map(function (item) {
      var price = num(item.price), orig = item.originalPrice ? num(item.originalPrice) : null, has = orig && orig > price;
      return '<div class="flex gap-3 p-3 border border-[#f0f0f0] rounded-lg">' +
        '<div class="w-[60px] h-[60px] flex-shrink-0 bg-[#f8f5f0] rounded-lg overflow-hidden border border-[#eee]">' +
        (item.image ? '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" class="w-full h-full object-cover" loading="lazy" />' : '<div class="w-full h-full flex items-center justify-center text-gray-300">' + icon('shopping-cart', 20) + '</div>') +
        '</div><div class="flex-1 min-w-0"><p class="text-[13px] font-semibold text-[#222] leading-snug">' + esc(item.name) + '</p><div class="mt-0.5">' +
        (has ? '<span class="text-[11px] text-[#999] line-through mr-1">' + orig + ' টাকা</span>' : '') +
        '<span class="text-[13px] text-[#1a3c2e] font-bold">' + price + ' টাকা</span></div>' +
        '<div class="flex items-center justify-between mt-2"><div class="flex items-center border border-[#ddd] rounded-full px-1 h-8">' +
        '<button type="button" data-qty="-1" data-id="' + esc(item.id) + '" class="w-7 h-full flex items-center justify-center text-[#999] hover:text-black transition-colors">-</button>' +
        '<span class="w-7 text-center font-bold text-[13px] text-[#222]">' + item.quantity + '</span>' +
        '<button type="button" data-qty="1" data-id="' + esc(item.id) + '" class="w-7 h-full flex items-center justify-center text-[#999] hover:text-black transition-colors">+</button></div>' +
        '<div class="flex items-center gap-3"><span class="text-[13px] font-bold text-[#1a3c2e]">' + (price * item.quantity) + ' টাকা</span>' +
        '<button type="button" data-remove="' + esc(item.id) + '" class="text-red-500 hover:text-red-700 transition-colors">' + icon('trash-2', 16) + '</button></div></div></div></div>';
    }).join('') + '</div>';
  }

  function itemRowsDesktop() {
    var head = '<thead><tr class="bg-[#f5f5f5] text-[14px] text-[#1a3c2e] font-bold uppercase tracking-wider">' +
      ['#', 'Image', 'Name', 'Unit Price', 'Qty', 'Total', 'Remove'].map(function (h) { return '<th class="px-4 py-3 border-b border-[#eee]">' + h + '</th>'; }).join('') + '</tr></thead>';
    var body;
    if (!state.cartItems.length) {
      body = '<tr><td colspan="7" class="px-4 py-20 text-center text-[#999]">আপনার কার্ট খালি। <a href="' + CFG.home + '/" class="text-brand-gold underline ml-2">কেনাকাটা চালিয়ে যান</a></td></tr>';
    } else {
      body = state.cartItems.map(function (item, idx) {
        var price = num(item.price), orig = item.originalPrice ? num(item.originalPrice) : null, has = orig && orig > price;
        return '<tr class="border-b border-[#f5f5f5] hover:bg-gray-50 transition-colors"><td class="px-4 py-4">' + (idx + 1) + '</td>' +
          '<td class="px-4 py-4"><div class="w-16 h-16 bg-[#f8f5f0] rounded-lg overflow-hidden border border-[#eee]">' +
          (item.image ? '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" class="w-full h-full object-cover" loading="lazy" decoding="async" />' : '<div class="w-full h-full flex items-center justify-center text-gray-300">' + icon('shopping-cart', 24) + '</div>') +
          '</div></td><td class="px-4 py-4 font-medium text-[#222] min-w-[150px]">' + esc(item.name) + '</td>' +
          '<td class="px-4 py-4 whitespace-nowrap">' + (has ? '<div class="text-[12px] text-[#999] line-through">' + orig + ' টাকা</div>' : '') + '<div class="text-[#1a3c2e] font-bold">' + price + ' টাকা</div></td>' +
          '<td class="px-4 py-4"><div class="flex items-center border border-[#ddd] rounded-full w-fit px-1 h-9">' +
          '<button type="button" data-qty="-1" data-id="' + esc(item.id) + '" class="w-8 h-full flex items-center justify-center text-[#999] hover:text-black transition-colors">-</button>' +
          '<span class="w-8 text-center font-bold text-[#222]">' + item.quantity + '</span>' +
          '<button type="button" data-qty="1" data-id="' + esc(item.id) + '" class="w-8 h-full flex items-center justify-center text-[#999] hover:text-black transition-colors">+</button></div></td>' +
          '<td class="px-4 py-4 whitespace-nowrap">' + (has ? '<div class="text-[12px] text-[#999] line-through">' + (orig * item.quantity) + ' টাকা</div>' : '') + '<div class="text-[#1a3c2e] font-bold">' + (price * item.quantity) + ' টাকা</div></td>' +
          '<td class="px-4 py-4 text-center"><button type="button" data-remove="' + esc(item.id) + '" class="flex flex-col items-center gap-1 text-red-500 hover:text-red-700 transition-colors">' + icon('trash-2', 18) + '<span class="text-[10px] font-bold uppercase">বাদ দিন</span></button></td></tr>';
      }).join('');
    }
    return '<div class="hidden md:block overflow-x-auto"><table class="w-full text-left border-collapse">' + head + '<tbody class="text-[15px]">' + body + '</tbody></table></div>';
  }

  function selectionsHtml() {
    var need = state.cartItems.some(function (i) { return (i.availableSizes && i.availableSizes.length > 0) || (i.availableColors && i.availableColors.length > 1); });
    if (!need) return '';
    return '<div class="mt-6 border-t border-[#f0f0f0] pt-6 space-y-4"><h3 class="text-[15px] font-bold text-[#1a1a1a]">সাইজ ও কালার নির্বাচন</h3>' +
      state.cartItems.map(function (item) {
        var hasSizes = item.availableSizes && item.availableSizes.length > 0;
        var multi = item.availableColors && item.availableColors.length > 1;
        if (!hasSizes && !multi) return '';
        var sel = state.itemSelections[item.id] || {}, err = state.selectionErrors[item.id] || {};
        var h = '<div class="p-4 rounded-[8px] border ' + ((err.size || err.color) ? 'border-red-300 bg-red-50' : 'border-[#eee] bg-[#fafafa]') + '"><p class="text-[13px] font-semibold text-[#555] mb-3">' + esc(item.name) + '</p>';
        if (hasSizes) {
          var badge = '';
          if (sel.size) {
            var rec = item.availableSizes.filter(function (s) { return s.size === sel.size; })[0];
            var av = rec ? rec.available : true;
            badge = '<span class="text-[11px] font-semibold px-1.5 py-0.5 border ' + (av ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200') + '">' + (av ? 'স্টকে আছে' : 'স্টক আউট') + '</span>';
          }
          h += '<div class="mb-3"><div class="flex items-center gap-2 mb-2 flex-wrap"><span class="text-[13px] font-bold text-[#1a1a1a]">সাইজ: <span class="text-[#555] font-normal">' + esc(sel.size || '—') + '</span></span>' + badge + '</div><div class="flex gap-2 flex-wrap">' +
            item.availableSizes.map(function (s) {
              return '<button type="button" data-size="' + esc(s.size) + '" data-id="' + esc(item.id) + '" ' + (s.available ? '' : 'disabled') + ' class="min-w-[44px] px-3 py-1.5 text-[13px] font-semibold border transition-all ' + (sel.size === s.size ? 'bg-[#1a3c2e] text-white border-[#1a3c2e]' : 'bg-white text-[#1a1a1a] border-[#ddd] hover:border-[#1a3c2e]') + (s.available ? '' : ' opacity-40 line-through cursor-not-allowed') + '">' + esc(s.size) + '</button>';
            }).join('') + '</div>' + (err.size ? '<p class="text-red-500 text-[12px] mt-1.5 font-medium">অর্ডার করার পূর্বে অনুগ্রহ করে সাইজ নির্বাচন করুন</p>' : '') + '</div>';
        }
        if (multi) {
          h += '<div><span class="text-[13px] font-bold text-[#1a1a1a] block mb-2">কালার: <span class="text-[#555] font-normal">' + (sel.colorIdx != null ? 'কালার ' + (sel.colorIdx + 1) : '—') + '</span></span><div class="flex gap-2 flex-wrap">' +
            item.availableColors.map(function (c, idx) {
              return '<button type="button" data-color="' + idx + '" data-id="' + esc(item.id) + '" class="relative w-12 h-12 border-2 overflow-hidden transition-all ' + (sel.colorIdx === idx ? 'border-[#1a3c2e] shadow-md' : 'border-[#ddd] hover:border-[#999]') + '"><img src="' + esc(c) + '" alt="Color ' + (idx + 1) + '" class="w-full h-full object-cover" /></button>';
            }).join('') + '</div>' + (err.color ? '<p class="text-red-500 text-[12px] mt-1.5 font-medium">অর্ডার করার পূর্বে অনুগ্রহ করে কালার নির্বাচন করুন</p>' : '') + '</div>';
        }
        return h + '</div>';
      }).join('') + '</div>';
  }

  function summaryHtml() {
    var t = totals(), c = state.appliedCoupon;
    var couponBox = c
      ? '<div class="flex items-center justify-between bg-green-50 border border-green-200 rounded-[8px] px-4 py-2.5"><div class="flex items-center gap-2 text-green-700 text-[14px] font-bold">' + icon('circle-check', 16) + '<span>কুপন <span class="font-mono">' + esc(c.code) + '</span> ব্যবহার করা হয়েছে — ৳' + money(c.discount) + ' ছাড়</span></div><button type="button" data-coupon-remove class="text-red-500 text-[12px] font-bold hover:underline ml-2">মুছুন</button></div>'
      : '<div class="flex gap-2 w-full"><input type="text" data-coupon-input placeholder="কুপন কোড লিখুন" value="' + esc(state.couponInput) + '" class="flex-1 min-w-0 h-[38px] px-2.5 rounded-[6px] border border-[#ddd] outline-none focus:border-[#1a3c2e] text-[13px] uppercase tracking-wider" />' +
        '<button type="button" data-coupon-apply ' + ((state.couponBusy || !state.couponInput.trim()) ? 'disabled' : '') + ' class="shrink-0 h-[38px] px-3 bg-[#1a3c2e] text-white rounded-[6px] text-[12px] font-bold hover:bg-[#0f2a1e] transition-colors disabled:opacity-50 whitespace-nowrap">' + (state.couponBusy ? icon('loader-circle', 14, 'animate-spin') : 'প্রয়োগ করুন') + '</button></div>';
    return '<div class="mt-4 space-y-2 w-full md:max-w-[400px] md:ml-auto"><div class="pb-3 border-b border-[#f0f0f0]">' + couponBox +
      '<p data-coupon-error class="text-red-500 text-[12px] font-medium mt-1" ' + (state.couponError ? '' : 'hidden') + '>' + esc(state.couponError) + '</p></div>' +
      '<div class="flex justify-between text-[13px] text-[#555]"><span>সাবটোটাল:</span><div class="text-right">' + (t.productDiscount > 0 ? '<div class="text-[11px] text-[#999] line-through">৳' + money(t.original) + '</div>' : '') + '<span class="font-bold text-[#222]">৳' + money(t.subtotal) + '</span></div></div>' +
      (t.productDiscount > 0 ? '<div class="flex justify-between text-[13px] text-green-600"><span>পণ্য ডিসকাউন্ট:</span><span class="font-bold">−৳' + money(t.productDiscount) + '</span></div>' : '') +
      (t.couponDiscount > 0 ? '<div class="flex justify-between text-[13px] text-green-600"><span>কুপন (' + esc(c.code) + '):</span><span class="font-bold">−৳' + money(t.couponDiscount) + '</span></div>' : '') +
      ((t.productDiscount > 0 || t.couponDiscount > 0) ? '<div class="flex justify-between text-[12px] font-semibold text-green-700 bg-green-50 rounded-[6px] px-2.5 py-1.5 -mx-1"><span>সর্বমোট সঞ্চয়:</span><span>−৳' + money(t.productDiscount + t.couponDiscount) + '</span></div>' : '') +
      '<div class="flex justify-between text-[13px] text-[#555]"><span>ডেলিভারি চার্জ:</span><span class="font-bold text-[#222]">৳' + money(state.shippingCharge) + '</span></div>' +
      '<div class="flex justify-between text-[18px] md:text-[22px] font-bold text-[#222] pt-2 border-t border-[#eee]"><span>সর্বমোট:</span><span class="text-[#1a3c2e]">৳' + money(t.grand) + '</span></div>' +
      '<p class="text-red-600 text-[12px] md:text-[13px] font-bold text-center pt-1.5">নিশ্চিত হয়ে অর্ডার করবেন। অযথা অর্ডার করবেন না।</p></div>';
  }

  function leftHtml() {
    return '<div class="bg-[#1a3c2e] px-4 py-3 flex items-center gap-2">' + icon('shopping-cart', 20, 'w-5 h-5 text-white') + '<h2 class="text-[16px] font-bold text-white">আপনার অর্ডার</h2></div>' +
      '<div class="p-3 md:p-8"><div class="md:hidden">' + itemRowsMobile() + '</div>' + itemRowsDesktop() + selectionsHtml() + summaryHtml() +
      '<div class="mt-4"><a href="' + CFG.home + '/" class="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-[6px] text-[12px] font-bold uppercase tracking-wide hover:opacity-80 transition-opacity">' + icon('arrow-left', 14) + ' কেনাকাটায় ফিরে যান</a></div></div>';
  }

  /* ───────── right panel (delivery form) — rendered once so typing keeps focus ───────── */
  function formHtml() {
    var arrow = "background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 16px center; background-size: 16px;";
    return '<div class="bg-[#1a1a1a] px-4 py-3 flex items-center gap-2 border-b border-[#f0f0f0]">' + icon('truck', 20, 'w-5 h-5 text-white') + '<h2 class="text-[16px] font-bold text-white">ডেলিভারি তথ্য</h2></div>' +
      '<div class="p-3 md:p-8"><form data-order-form class="space-y-3 md:space-y-6" novalidate>' +
      '<div><label class="block text-[13px] font-bold text-[#555] mb-1">আপনার নাম*</label><input required type="text" name="name" placeholder="আপনার নাম লিখুন" autocomplete="name" class="w-full h-[42px] px-3 rounded-[8px] border border-[#ddd] outline-none focus:border-[#1a3c2e] transition-colors text-[14px]" /></div>' +
      '<div><label class="block text-[13px] font-bold text-[#555] mb-1">আপনার মোবাইল নম্বর*</label><input required type="tel" name="phone" placeholder="01XXXXXXXXX" autocomplete="tel" class="w-full h-[42px] px-3 rounded-[8px] border border-[#ddd] outline-none focus:border-[#1a3c2e] transition-colors text-[14px]" />' +
      '<p data-phone-error hidden class="text-red-500 text-[12px] font-bold mt-1">অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর দিন — ১১ ডিজিটের বাংলাদেশি নম্বর হতে হবে (যেমন: 01XXXXXXXXX)</p></div>' +
      '<div><label class="block text-[13px] font-bold text-[#555] mb-1">আপনার ঠিকানা*</label><textarea required name="address" placeholder="আপনার সম্পূর্ণ ঠিকানা লিখুন (বাসা নম্বর, রোড নম্বর, এলাকা, থানা, জেলা)" autocomplete="street-address" class="w-full h-[80px] p-3 rounded-[8px] border border-[#ddd] outline-none focus:border-[#1a3c2e] transition-colors text-[14px] resize-none"></textarea></div>' +
      '<div><label class="block text-[13px] font-bold text-[#555] mb-2">ডেলিভারি এলাকা*</label><div class="space-y-2">' +
      SHIPPING_OPTIONS.map(function (o) {
        return '<label data-zone-label="' + o.value + '" class="flex items-center gap-2.5 p-2.5 rounded-[8px] border-2 cursor-pointer transition-all"><input type="radio" name="shipping_zone" value="' + o.value + '" class="w-4 h-4 accent-[#1a3c2e]" /><div class="flex justify-between items-center w-full"><span class="text-[14px] font-semibold text-[#222]">' + o.label + '</span><span class="text-[14px] font-bold text-[#1a3c2e]">৳' + o.charge + '</span></div></label>';
      }).join('') + '</div></div>' +
      '<div><label class="block text-[13px] font-bold text-[#555] mb-1">ডেলিভারি পদ্ধতি*</label><select required name="shipping_method" class="w-full h-[42px] px-3 rounded-[8px] border border-[#ddd] outline-none focus:border-[#1a3c2e] transition-colors text-[14px] bg-white appearance-none" style="' + arrow + '"><option value="Cash on Delivery">ক্যাশ অন ডেলিভারি (Cash on Delivery)</option></select></div>' +
      '<div data-order-error hidden class="bg-red-50 border border-red-200 rounded-[8px] px-4 py-3 text-[13px] font-semibold text-red-600"></div>' +
      '<button type="submit" data-submit class="w-full h-[48px] md:h-[60px] bg-[#1a3c2e] text-white rounded-[8px] text-[15px] md:text-[18px] font-bold uppercase tracking-wide hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">অর্ডার কনফার্ম করুন</button>' +
      '</form></div>';
  }

  /* ───────── mount ───────── */
  var leftEl, rightEl, formEl;
  function mount() {
    // The root itself carries the page classes so it is the direct child of <main> (the mobile CSS
    // zeroes the padding of main's first child, exactly as on the original page).
    root.className = 'min-h-screen bg-[#f5f5f5] py-3 md:py-16';
    root.innerHTML = '<div class="mx-auto max-w-[1280px] px-3 md:px-6"><div class="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-3 md:gap-8 items-start">' +
      '<div data-left class="bg-white rounded-[12px] shadow-sm overflow-hidden border border-[#eee]"></div>' +
      '<div data-right class="bg-white rounded-[12px] shadow-sm overflow-hidden border border-[#eee]"></div></div></div>' +
      '<div data-modal hidden class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"><div class="p-6">' +
      '<div class="flex justify-between items-start mb-4"><div class="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 text-red-500">' + icon('trash-2', 24) + '</div><button type="button" data-modal-cancel class="text-[#999] hover:text-[#555] transition-colors">' + icon('x', 20) + '</button></div>' +
      '<h3 class="text-[20px] font-bold text-[#222] mb-2">পণ্যটি বাদ দিতে চান?</h3><p data-modal-msg class="text-[#666] text-[15px] leading-relaxed mb-8"></p>' +
      '<div class="flex gap-3"><button type="button" data-modal-cancel class="flex-1 py-3 px-4 rounded-xl border border-[#ddd] text-[#555] font-bold text-[14px] uppercase tracking-wider hover:bg-[#f5f5f5] transition-colors">বাতিল করুন</button>' +
      '<button type="button" data-modal-ok class="flex-1 py-3 px-4 rounded-xl text-white font-bold text-[14px] uppercase tracking-wider transition-all shadow-lg bg-red-500 hover:bg-red-600 shadow-red-500/20">হ্যাঁ, বাদ দিন</button></div></div></div></div></div>';
    leftEl = root.querySelector('[data-left]');
    rightEl = root.querySelector('[data-right]');
    rightEl.innerHTML = formHtml();
    formEl = rightEl.querySelector('[data-order-form]');
    renderLeft();
    syncForm();
    bind();
  }

  function renderLeft() { leftEl.innerHTML = leftHtml(); }

  function syncForm() {
    var f = state.form;
    formEl.elements.name.value = f.name;
    formEl.elements.phone.value = f.phone;
    formEl.elements.address.value = f.address;
    formEl.elements.shipping_method.value = f.shipping_method;
    SHIPPING_OPTIONS.forEach(function (o) {
      var label = formEl.querySelector('[data-zone-label="' + o.value + '"]');
      var on = f.shipping_zone === o.value;
      label.querySelector('input').checked = on;
      label.classList.toggle('border-[#1a3c2e]', on); label.classList.toggle('bg-[#f0f5f2]', on);
      label.classList.toggle('border-[#ddd]', !on); label.classList.toggle('hover:border-[#aaa]', !on);
    });
    var pe = formEl.querySelector('[data-phone-error]');
    pe.hidden = !state.phoneError;
    formEl.elements.phone.classList.toggle('border-red-500', state.phoneError);
    formEl.elements.phone.classList.toggle('border-[#ddd]', !state.phoneError);
    var err = formEl.querySelector('[data-order-error]');
    if (state.orderError) {
      var wa = '';
      if (state.orderError.indexOf('ইতিমধ্যে একটি অর্ডার') !== -1) {
        wa = '<p class="mt-1">এর আগে অর্ডার করতে চাইলে হোয়াটস এপ এ যোগাযোগ করুন।</p><a href="' + esc(CFG.whatsapp) + '" target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex items-center justify-center gap-2 w-full h-[42px] bg-[#25D366] text-white rounded-[6px] text-[13px] font-bold hover:opacity-90 transition-opacity">' + icon('message-circle', 16) + ' হোয়াটসঅ্যাপে মেসেজ করুন</a>';
      }
      err.innerHTML = '<p>' + esc(state.orderError) + '</p>' + wa;
      err.hidden = false;
    } else { err.hidden = true; }
    var btn = formEl.querySelector('[data-submit]');
    btn.disabled = state.placing || state.cartItems.length === 0;
    btn.innerHTML = state.placing ? icon('loader-circle', 24, 'animate-spin') + 'অর্ডার সম্পন্ন হচ্ছে...' : 'অর্ডার কনফার্ম করুন';
  }

  /* ───────── cart mutations ───────── */
  function persist() { if (!buyNowId) { try { localStorage.setItem('cart', JSON.stringify(state.cartItems)); } catch (e) { /* ignore */ } } }
  function find(id) { return state.cartItems.filter(function (i) { return String(i.id) === String(id); })[0]; }

  function bind() {
    leftEl.addEventListener('click', function (e) {
      var t = e.target.closest('button, a'); if (!t) return;
      if (t.hasAttribute('data-qty')) {
        var id = t.getAttribute('data-id'), d = parseInt(t.getAttribute('data-qty'), 10);
        state.cartItems = state.cartItems.map(function (i) { return String(i.id) === id ? Object.assign({}, i, { quantity: Math.max(1, i.quantity + d) }) : i; });
        persist(); renderLeft(); scheduleDraft(); return;
      }
      if (t.hasAttribute('data-remove')) {
        var rid = t.getAttribute('data-remove'), it = find(rid); if (!it) return;
        state.confirm = rid;
        root.querySelector('[data-modal-msg]').textContent = 'আপনি কি নিশ্চিত যে আপনার অর্ডার থেকে "' + it.name + '" বাদ দিতে চান?';
        root.querySelector('[data-modal]').hidden = false; return;
      }
      if (t.hasAttribute('data-size')) {
        var sid = t.getAttribute('data-id');
        state.itemSelections[sid] = Object.assign({}, state.itemSelections[sid], { size: t.getAttribute('data-size') });
        state.selectionErrors[sid] = Object.assign({}, state.selectionErrors[sid], { size: false });
        renderLeft(); return;
      }
      if (t.hasAttribute('data-color')) {
        var cid = t.getAttribute('data-id');
        state.itemSelections[cid] = Object.assign({}, state.itemSelections[cid], { colorIdx: parseInt(t.getAttribute('data-color'), 10) });
        state.selectionErrors[cid] = Object.assign({}, state.selectionErrors[cid], { color: false });
        renderLeft(); return;
      }
      if (t.hasAttribute('data-coupon-apply')) { applyCoupon(); return; }
      if (t.hasAttribute('data-coupon-remove')) { state.appliedCoupon = null; state.couponInput = ''; state.couponError = ''; renderLeft(); }
    });
    leftEl.addEventListener('input', function (e) {
      if (e.target.hasAttribute('data-coupon-input')) {
        state.couponInput = e.target.value.toUpperCase(); e.target.value = state.couponInput; state.couponError = '';
        var er = leftEl.querySelector('[data-coupon-error]'); if (er) er.hidden = true;
        var ab = leftEl.querySelector('[data-coupon-apply]'); if (ab) ab.disabled = state.couponBusy || !state.couponInput.trim();
      }
    });
    leftEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.hasAttribute('data-coupon-input')) { e.preventDefault(); applyCoupon(); }
    });

    root.querySelectorAll('[data-modal-cancel]').forEach(function (b) { b.addEventListener('click', function () { root.querySelector('[data-modal]').hidden = true; state.confirm = null; }); });
    root.querySelector('[data-modal-ok]').addEventListener('click', function () {
      var id = state.confirm;
      state.cartItems = state.cartItems.filter(function (i) { return String(i.id) !== String(id); });
      persist(); window.dispatchEvent(new CustomEvent('cart:add'));
      root.querySelector('[data-modal]').hidden = true; state.confirm = null; renderLeft(); syncForm(); scheduleDraft();
    });

    formEl.elements.name.addEventListener('input', function (e) { state.form.name = e.target.value; scheduleDraft(); });
    formEl.elements.address.addEventListener('input', function (e) { state.form.address = e.target.value; scheduleDraft(); });
    formEl.elements.phone.addEventListener('input', function (e) {
      var v = e.target.value.replace(/[^0-9+\-]/g, ''); e.target.value = v; state.form.phone = v;
      if (state.phoneError) { state.phoneError = false; syncForm(); }
      scheduleDraft();
    });
    formEl.elements.shipping_method.addEventListener('change', function (e) { state.form.shipping_method = e.target.value; });
    formEl.querySelectorAll('input[name=shipping_zone]').forEach(function (r) {
      r.addEventListener('change', function () {
        var opt = SHIPPING_OPTIONS.filter(function (o) { return o.value === r.value; })[0];
        state.form.shipping_zone = opt.value; state.shippingCharge = opt.charge;
        syncForm(); renderLeft(); scheduleDraft();
      });
    });
    formEl.addEventListener('submit', placeOrder);
  }

  function applyCoupon() {
    var code = state.couponInput.trim(); if (!code) return;
    state.couponBusy = true; state.couponError = ''; renderLeft();
    fetch(CFG.rest + 'coupons/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code, subtotal: totals().subtotal }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { state.couponError = res.d.error || 'কুপনটি সঠিক নয়।'; state.appliedCoupon = null; }
        else { state.appliedCoupon = { code: res.d.code, discount: res.d.discount }; state.couponError = ''; }
      })
      .catch(function () { state.couponError = 'কুপনটি ব্যবহার করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'; })
      .then(function () { state.couponBusy = false; renderLeft(); });
  }

  function normalizePhone(raw) {
    var n = raw.replace(/[\s\-\(\)]/g, '');
    if (n.indexOf('+880') === 0) n = '0' + n.slice(4); else if (n.indexOf('880') === 0) n = '0' + n.slice(3);
    return n;
  }

  function placeOrder(e) {
    e.preventDefault();
    state.orderError = '';
    if (!state.cartItems.length) { state.orderError = 'আপনার কার্ট খালি!'; syncForm(); return; }
    var phone = normalizePhone(state.form.phone);
    if (!phone || !/^01[3-9][0-9]{8}$/.test(phone)) { state.phoneError = true; syncForm(); formEl.elements.phone.focus(); return; }
    if (!state.form.name || !state.form.address) { state.orderError = 'নাম ও ঠিকানা পূরণ করুন।'; syncForm(); return; }

    var errors = {}, bad = false;
    state.cartItems.forEach(function (item) {
      var sel = state.itemSelections[item.id] || {};
      if (item.availableSizes && item.availableSizes.length > 0 && !sel.size) { errors[item.id] = Object.assign({}, errors[item.id], { size: true }); bad = true; }
      if (item.availableColors && item.availableColors.length > 1 && (sel.colorIdx === undefined || sel.colorIdx === null)) { errors[item.id] = Object.assign({}, errors[item.id], { color: true }); bad = true; }
    });
    if (bad) { state.selectionErrors = errors; renderLeft(); return; }

    state.placing = true; isPlacing = true; syncForm();
    var t = totals();
    fetch(CFG.rest + 'orders/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': CFG.nonce }, credentials: 'same-origin',
      body: JSON.stringify({
        customerId: CFG.user ? CFG.user.id : null, name: state.form.name, phone: phone, address: state.form.address,
        items: state.cartItems.map(function (item) {
          var colorIdx = (state.itemSelections[item.id] || {}).colorIdx;
          colorIdx = colorIdx === undefined ? null : colorIdx;
          var colorUrl = (item.availableColors && item.availableColors.length > 0 && colorIdx !== null) ? item.availableColors[colorIdx] : null;
          return { productId: item.id, quantity: item.quantity, size: (state.itemSelections[item.id] || {}).size || undefined, color: colorUrl || undefined };
        }),
        paymentMethod: 'cash', couponCode: state.appliedCoupon ? state.appliedCoupon.code : undefined, shippingZone: state.form.shipping_zone
      })
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.d.success) throw new Error(res.d.error || res.d.message || 'Failed to create order');
        var orderId = res.d.orderId;
        try {
          localStorage.setItem('sv_last_order', JSON.stringify({
            orderId: orderId, name: state.form.name, phone: phone, address: state.form.address,
            items: state.cartItems.map(function (i) { return { id: i.id, name: i.name, price: i.price, image: i.image || '', quantity: i.quantity }; }),
            subtotal: t.subtotal, shipping: state.shippingCharge, discount: t.couponDiscount, total: t.grand,
            paymentMethod: 'cash', amountPaid: 0, placedAt: new Date().toISOString()
          }));
          if (state.appliedCoupon) localStorage.setItem('sv_last_coupon_code', state.appliedCoupon.code); else localStorage.removeItem('sv_last_coupon_code');
          var saved = JSON.parse(localStorage.getItem('cart') || '[]');
          var ordered = state.cartItems.map(function (i) { return i.id; });
          localStorage.setItem('cart', JSON.stringify(saved.filter(function (i) { return ordered.indexOf(i.id) === -1; })));
          localStorage.removeItem('sv_buy_now_item');
          localStorage.setItem('sv_checkout_info', JSON.stringify({ name: state.form.name, phone: phone, address: state.form.address }));
        } catch (err) { /* storage unavailable */ }
        window.dispatchEvent(new CustomEvent('cart:add'));
        if (draftSession) {
          fetch(CFG.rest + 'orders/draft', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: draftSession }) }).catch(function () {});
          try { localStorage.removeItem('sv_draft_session'); } catch (err) { /* ignore */ }
          draftSession = '';
        }
        window.location.href = CFG.home + '/thank-you/' + encodeURIComponent(orderId);
      })
      .catch(function (err) {
        var m = err && err.message && !/failed to fetch|networkerror|load failed/i.test(err.message) ? err.message : 'অর্ডার সম্পন্ন করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।';
        state.orderError = m; state.placing = false; isPlacing = false; syncForm();
      });
  }

  /* ───────── load cart / profile ───────── */
  function initSelections(items) {
    var initial = {};
    items.forEach(function (item) {
      var sizeAvail = !item.selectedSize || ((item.availableSizes || []).filter(function (s) { return s.size === item.selectedSize; })[0] || { available: true }).available;
      initial[item.id] = {
        size: sizeAvail ? (item.selectedSize || null) : null,
        colorIdx: item.availableColors && item.availableColors.length === 1 ? 0 : (item.selectedColorIdx != null ? item.selectedColorIdx : null)
      };
    });
    state.itemSelections = initial;
  }

  function load() {
    // saved info for repeat customers, then profile of the logged-in customer
    try {
      var info = JSON.parse(localStorage.getItem('sv_checkout_info') || 'null');
      if (info) { state.form.name = info.name || state.form.name; state.form.phone = info.phone || state.form.phone; state.form.address = info.address || state.form.address; }
    } catch (e) { /* ignore */ }
    if (CFG.user) {
      state.form.name = CFG.user.name || state.form.name; state.form.phone = CFG.user.phone || state.form.phone; state.form.address = CFG.user.address || state.form.address;
    }

    var saved = null, buyNow = null;
    try { saved = localStorage.getItem('cart'); buyNow = JSON.parse(localStorage.getItem('sv_buy_now_item') || 'null'); } catch (e) { /* ignore */ }
    var items = [];
    if (buyNowId) {
      if (buyNow && String(buyNow.id) === buyNowId) items = [buyNow];
      if (!items.length && saved) { try { items = JSON.parse(saved).filter(function (i) { return String(i.id) === buyNowId; }); } catch (e) { /* ignore */ } }
    } else if (saved) {
      try { var p = JSON.parse(saved); if (Array.isArray(p)) items = p; } catch (e) { /* ignore */ }
    }

    var needMeta = items.filter(function (i) { return !i.availableColors && !i.availableSizes; });
    var enrich = needMeta.length ? fetch(CFG.rest + 'products/meta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: needMeta.map(function (i) { return i.id; }) }) })
      .then(function (r) { return r.ok ? r.json() : { data: [] }; })
      .then(function (j) {
        var map = {}; (j.data || []).forEach(function (m) { map[m.id] = m; });
        items = items.map(function (item) {
          var m = map[item.id];
          if (m && !item.availableColors && !item.availableSizes) {
            var colors = Array.isArray(m.colors) ? m.colors : [], sizes = Array.isArray(m.sizes) ? m.sizes : [];
            return Object.assign({}, item, {
              availableColors: colors.length ? colors : undefined, availableSizes: sizes.length ? sizes : undefined,
              selectedColorIdx: colors.length ? 0 : undefined, selectedSize: sizes.length ? (sizes[0] ? sizes[0].size : undefined) : undefined
            });
          }
          return item;
        });
      }).catch(function () { /* non-fatal */ }) : Promise.resolve();

    enrich.then(function () {
      state.cartItems = items; initSelections(items);
      mount();
      if (items.length) {
        var value = items.reduce(function (a, it) { return a + (num(it.price) || 0) * (it.quantity || 1); }, 0);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
          event: 'begin_checkout', event_id: uuid(),
          ecommerce: { currency: 'BDT', value: value, items: items.map(function (it) { return { item_id: it.id, item_name: it.name, item_brand: 'Nahian Fashion', item_category: it.category || 'Fashion', price: num(it.price) || 0, quantity: it.quantity || 1 }; }) }
        });
      }
    });
  }

  load();
})();
