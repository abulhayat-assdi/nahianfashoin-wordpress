/* Thank-you page: redirect helper for /thank-you, GA4/Meta purchase event (once per order and browser
 * session), localised date and the "Download Invoice" PDF. */
(function () {
  'use strict';

  /* /thank-you without an id -> last order from localStorage, else home */
  var redirect = document.querySelector('[data-nf-thankyou-redirect]');
  if (redirect) {
    var home = redirect.getAttribute('data-home') || '';
    try {
      var last = JSON.parse(localStorage.getItem('sv_last_order') || 'null');
      if (last && last.orderId) { window.location.replace(home + '/thank-you/' + encodeURIComponent(last.orderId)); return; }
    } catch (e) { /* ignore */ }
    window.location.replace(home + '/');
    return;
  }

  var wrap = document.querySelector('[data-nf-purchase]');
  if (!wrap) return;
  var order = JSON.parse(wrap.getAttribute('data-nf-purchase'));

  var dateEl = document.querySelector('[data-nf-date]');
  if (dateEl) {
    var d = new Date(dateEl.getAttribute('data-nf-date'));
    if (!isNaN(d.getTime())) dateEl.textContent = d.toLocaleString('en-BD');
  }

  /* purchase event — never twice for the same order within a browser session */
  (function () {
    var key = 'purchase_tracked_' + order.orderId;
    try { if (sessionStorage.getItem(key)) return; } catch (e) { /* proceed */ }
    try { sessionStorage.setItem(key, '1'); } catch (e) { /* ignore */ }
    var coupon = null;
    try { coupon = localStorage.getItem('sv_last_coupon_code'); localStorage.removeItem('sv_last_coupon_code'); } catch (e) { /* ignore */ }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    var ecommerce = { transaction_id: order.orderId, value: order.total, tax: 0, shipping: order.shipping, currency: 'BDT', items: order.items };
    if (order.discount > 0) ecommerce.coupon = coupon || 'DISCOUNT_APPLIED';
    window.dataLayer.push({ event: 'purchase', event_id: order.orderId, ecommerce: ecommerce });
  })();

  /* invoice PDF */
  var btn = document.querySelector('[data-nf-invoice]');
  var target = document.querySelector('[data-nf-invoice-target]');
  if (!btn || !target) return;
  var idle = btn.querySelector('[data-invoice-idle]'), busy = btn.querySelector('[data-invoice-busy]');
  btn.addEventListener('click', function () {
    btn.disabled = true; idle.hidden = true; busy.hidden = false;
    var originalPosition = target.style.position;
    var mark = document.createElement('div');
    mark.innerHTML = 'NAHIAN FASHION';
    mark.style.cssText = 'position:absolute;top:45%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:clamp(40px,8vw,80px);font-weight:900;color:rgba(22,163,74,0.15);pointer-events:none;z-index:50;white-space:nowrap;text-align:center;user-select:none';
    if (window.getComputedStyle(target).position === 'static') target.style.position = 'relative';
    target.appendChild(mark);
    var width = target.offsetWidth, height = target.offsetHeight;
    window.htmlToImage.toPng(target, { quality: 1.0, pixelRatio: 2, backgroundColor: '#f0fdf4', width: width, height: height, style: { margin: '0', transform: 'none' }, skipFonts: true, fontEmbedCSS: '' })
      .then(function (dataUrl) {
        var pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        var pw = pdf.internal.pageSize.getWidth();
        var props = pdf.getImageProperties(dataUrl);
        pdf.addImage(dataUrl, 'PNG', 0, 0, pw, (props.height * pw) / props.width);
        pdf.save('Invoice_' + (order.orderId || 'Order') + '.pdf');
      })
      .catch(function (err) { console.error('Failed to generate PDF', err); })
      .then(function () {
        mark.remove(); target.style.position = originalPosition;
        btn.disabled = false; idle.hidden = false; busy.hidden = true;
      });
  });
})();
