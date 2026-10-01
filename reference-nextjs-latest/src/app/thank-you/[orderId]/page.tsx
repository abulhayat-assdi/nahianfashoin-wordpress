"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { CheckCircle, Package, MapPin, Phone, User, CreditCard, Download, Loader2 } from "lucide-react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { parsePrice } from "@/lib/parse-price";

type OrderItem = { id: string; name: string; price: string; image: string; quantity: number; category?: string; size?: string | null; color?: string | null; };
type OrderData = {
  orderId: string;
  name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  placedAt: string;
  status: string;
};

/** Statuses that must NEVER trigger a Purchase event */
const BLOCKED_STATUSES = new Set(['incomplete', 'failed', 'cancelled']);

export default function ThankYouOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const hasFiredPurchase = useRef(false);

  const handleDownloadPDF = async () => {
    if (!targetRef.current) return;
    setIsDownloading(true);

    const el = targetRef.current;
    const originalPosition = el.style.position;
    
    // Add Watermark Dynamically
    const watermark = document.createElement("div");
    watermark.innerHTML = "NAHIAN FASHION";
    watermark.style.position = "absolute";
    watermark.style.top = "45%";
    watermark.style.left = "50%";
    watermark.style.transform = "translate(-50%, -50%) rotate(-45deg)";
    watermark.style.fontSize = "clamp(40px, 8vw, 80px)";
    watermark.style.fontWeight = "900";
    watermark.style.color = "rgba(22, 163, 74, 0.15)"; // More visible faint green
    watermark.style.pointerEvents = "none";
    watermark.style.zIndex = "50";
    watermark.style.whiteSpace = "nowrap";
    watermark.style.textAlign = "center";
    watermark.style.userSelect = "none";

    if (window.getComputedStyle(el).position === "static") {
      el.style.position = "relative";
    }
    el.appendChild(watermark);

    try {
      // Force dimensions to avoid capturing right-side white scrollbar gaps
      const width = el.offsetWidth;
      const height = el.offsetHeight;

      const dataUrl = await htmlToImage.toPng(el, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#f0fdf4',
        width: width,
        height: height,
        style: {
          margin: '0',
          transform: 'none',
        },
        skipFonts: true,
        fontEmbedCSS: '',
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${order?.orderId || "Order"}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      watermark.remove();
      el.style.position = originalPosition;
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const decodedOrderId = decodeURIComponent(orderId);

      // Block draft/incomplete order IDs from ever showing the confirmation page
      if (decodedOrderId.startsWith('DRAFT-')) {
        setNotFound(true);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(decodedOrderId)}`);
        if (res.ok) {
          const json = await res.json();
          const data = json.data;
          if (data) {
            // Block incomplete/failed orders from showing the success page
            if (BLOCKED_STATUSES.has(data.status)) {
              setNotFound(true);
              return;
            }
            setOrder({
              orderId: data.order_id,
              name: data.customer_name,
              phone: data.phone,
              address: data.address,
              items: (data.items || []).map((i: any) => ({
                id: i.product_id,
                name: i.product_name,
                price: i.price.toString(),
                image: i.image_url || '',
                quantity: i.quantity,
                category: i.category ?? undefined,
                size: i.size ?? null,
                color: i.color ?? null,
              })),
              subtotal: Number(data.subtotal),
              shipping: Number(data.shipping),
              discount: Number(data.discount),
              total: Number(data.total),
              paymentMethod: data.payment_method,
              amountPaid: Number(data.amount_paid),
              placedAt: data.placed_at,
              status: data.status,
            });
            return;
          }
        }
      } catch (err) {
        console.error("API fetch failed, falling back to local storage", err);
      }

      // Fallback to local storage if API fails or order not found
      const stored = localStorage.getItem("sv_last_order");
      if (stored) {
        try {
          const parsed: OrderData = JSON.parse(stored);
          if (parsed.orderId === decodedOrderId) {
            setOrder({ ...parsed, status: parsed.status || 'pending' });
            return;
          }
        } catch {}
      }

      setNotFound(true);
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order || hasFiredPurchase.current) return;

    // ── Deduplication: sessionStorage survives page refresh but not tab close ──
    // This prevents the Purchase event from firing again if the user refreshes
    // the page or navigates back to this URL within the same browser session.
    const dedupKey = `purchase_tracked_${order.orderId}`;
    try {
      if (sessionStorage.getItem(dedupKey)) return;
    } catch { /* sessionStorage unavailable — proceed but guard via ref */ }

    // ── Status gate: never fire for incomplete/failed/cancelled orders ──
    if (BLOCKED_STATUSES.has(order.status)) return;

    hasFiredPurchase.current = true;

    // Mark as tracked BEFORE pushing to dataLayer (crash-safe)
    try { sessionStorage.setItem(dedupKey, '1'); } catch {}

    const couponCode = localStorage.getItem("sv_last_coupon_code");
    localStorage.removeItem("sv_last_coupon_code");

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "purchase",
      // Same id is sent server-side via Meta Conversions API — lets Meta deduplicate
      event_id: order.orderId,
      ecommerce: {
        transaction_id: order.orderId,
        value: order.total,
        tax: 0,
        shipping: order.shipping,
        currency: "BDT",
        ...(order.discount > 0 && { coupon: couponCode || "DISCOUNT_APPLIED" }),
        items: order.items.map((item) => ({
          item_id: item.id,
          item_name: item.name,
          item_brand: "Nahian Fashion",
          item_category: item.category ?? "Fashion",
          price: parsePrice(item.price),
          quantity: item.quantity,
        })),
      },
    });
  }, [order]);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(data => {
      setUser(data.user || null);
    });
  }, []);

  const fmt = (n: number) => `Tk ${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  if (!order && !notFound) {
    return (
      <div className="min-h-screen bg-[#f0fdf4] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f0fdf4] flex flex-col items-center justify-center px-4 text-center">
        <CheckCircle size={56} className="text-green-500 mb-4" />
        <h1 className="text-[24px] font-bold text-[#222] mb-2">Order Not Found</h1>
        <p className="text-[14px] text-[#666] mb-4">Order <span className="font-mono font-bold">{orderId}</span> could not be loaded.</p>
        <Link href="/" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-[13px] font-bold transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const isOnline = order!.paymentMethod !== "cash";

  return (
    <div className="min-h-screen bg-[#f0fdf4]">
      {/* Header */}
      <header className="w-full bg-white border-b border-[#d1fae5] py-5 px-6">
        <div className="max-w-[760px] mx-auto flex justify-between items-center">
          <Link href="/" className="text-[28px] font-heading text-green-700 font-medium">Nahian Fashion</Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-green-50 border border-green-600 text-green-700 hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Downloading...
                </>
              ) : (
                <>
                  <Download size={16} /> Download Invoice
                </>
              )}
            </button>
            <Link href="/" className="text-[14px] text-[#666] hover:text-green-700 transition hidden sm:inline">← Continue Shopping</Link>
          </div>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-4 py-10 space-y-6">
        {/* Invoice Container for PDF Export */}
        <div ref={targetRef} className="space-y-6 bg-[#f0fdf4] p-2 sm:p-6 rounded-3xl relative overflow-hidden">
          {/* Success Banner — GREEN */}
          <div className="bg-white rounded-2xl border border-[#d1fae5] shadow-sm overflow-hidden">
          <div
            style={{ background: "linear-gradient(135deg, #16a34a 0%, #10b981 100%)" }}
            className="px-6 py-10 text-center"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={38} className="text-white" />
            </div>
            <h1 className="text-[26px] font-bold text-white mb-1">Thank You for Your Order!</h1>
            <p className="text-white/85 text-[15px]">Your order has been placed successfully.</p>
          </div>
          <div className="px-6 py-4 bg-[#f0fdf4] flex flex-wrap gap-4 justify-between text-[13px] border-t border-[#d1fae5]">
            <span className="text-[#555]">Order ID: <strong className="text-green-700 font-mono">{order!.orderId}</strong></span>
            <span className="text-[#555]">Date: <strong className="text-[#222]">{new Date(order!.placedAt).toLocaleString("en-BD")}</strong></span>
            <span className={`font-bold px-3 py-1 rounded-full text-[12px] ${isOnline ? "bg-green-100 text-green-700" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {isOnline ? "✓ Payment Received" : "Cash on Delivery"}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-[#d1fae5] shadow-sm p-6">
          <h2 className="text-[16px] font-bold text-[#222] mb-4 flex items-center gap-2">
            <User size={18} className="text-green-600" /> Customer Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User size={16} className="text-[#999] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-[#999] uppercase tracking-wide mb-0.5">Full Name</p>
                <p className="text-[14px] font-bold text-[#222]">{order!.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-[#999] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-[#999] uppercase tracking-wide mb-0.5">Mobile</p>
                <p className="text-[14px] font-bold text-[#222]">{order!.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <MapPin size={16} className="text-[#999] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-[#999] uppercase tracking-wide mb-0.5">Delivery Address</p>
                <p className="text-[14px] font-bold text-[#222]">{order!.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-[#d1fae5] shadow-sm p-6">
          <h2 className="text-[16px] font-bold text-[#222] mb-4 flex items-center gap-2">
            <Package size={18} className="text-green-600" /> Order Items ({order!.items.reduce((a, i) => a + i.quantity, 0)} items)
          </h2>
          <div className="space-y-3 mb-5">
            {order!.items.map((item, idx) => (
              <div key={idx} className="border border-[#e8f5e9] rounded-xl overflow-hidden last:mb-0">
                {/* ── Product row ── */}
                <div className="flex gap-3 items-center p-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#d1fae5] bg-[#f0fdf4] flex-shrink-0 flex items-center justify-center">
                    {item.image && item.image.trim() !== "" ? (
                      <NextImage src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-7 h-7 text-[#ccc]"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5"/><path d="M3 9l4-4 4 4 4-4 4 4" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="14" r="2" strokeWidth="1.5"/></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#222] line-clamp-2">{item.name}</p>
                    <p className="text-[12px] text-[#777] mt-0.5">{item.price} × {item.quantity}</p>
                  </div>
                  <p className="text-[14px] font-bold text-[#222] flex-shrink-0">
                    {fmt(parsePrice(item.price) * item.quantity)}
                  </p>
                </div>

                {/* ── Size & Color section ── */}
                {(item.size || item.color) && (
                  <div className="border-t border-[#e8f5e9] bg-[#f7fef9] px-3 py-2.5 flex gap-5 items-center flex-wrap">
                    {item.size && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">SIZE</span>
                        <span className="text-[15px] font-extrabold text-green-700 bg-green-50 border-2 border-green-300 rounded-md px-3 py-0.5 tracking-wide">
                          {item.size}
                        </span>
                      </div>
                    )}
                    {item.color && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">COLOR</span>
                        {item.color.startsWith('http') || item.color.startsWith('/') ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={item.color}
                              alt="selected color"
                              className="w-10 h-10 rounded-md object-cover flex-shrink-0 border-2 border-green-300"
                            />
                            <span className="text-[11px] text-[#666]">Selected</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md border-2 border-[#ccc] flex-shrink-0" style={{ background: item.color }} />
                            <span className="text-[12px] font-semibold text-[#333]">{item.color}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bill Summary */}
          <div className="bg-[#f0fdf4] rounded-xl p-4 space-y-2 border border-[#d1fae5]">
            <div className="flex justify-between text-[13px] text-[#555]">
              <span>Subtotal</span>
              <span>{fmt(order!.subtotal)}</span>
            </div>
            {order!.discount > 0 && (
              <div className="flex justify-between text-[13px] text-green-600">
                <span>Discount</span>
                <span>- {fmt(order!.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[13px] text-[#555]">
              <span>Delivery Charge</span>
              <span>{fmt(order!.shipping)}</span>
            </div>
            <div className="flex justify-between text-[16px] font-bold text-[#222] border-t border-[#d1fae5] pt-2 mt-2">
              <span>Total Amount</span>
              <span className="text-green-700">{fmt(order!.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-2xl border border-[#d1fae5] shadow-sm p-6">
          <h2 className="text-[16px] font-bold text-[#222] mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-green-600" /> Payment Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="text-[#999] uppercase tracking-wide text-[11px] mb-1">Payment Method</p>
              <p className="font-bold text-[#222]">
                {order!.paymentMethod === "cash" ? "Cash on Delivery" : order!.paymentMethod === "sslcommerz" ? "SSLCommerz" : "bKash"}
              </p>
            </div>
            <div>
              <p className="text-[#999] uppercase tracking-wide text-[11px] mb-1">
                {isOnline ? "Amount Paid" : "Amount to Pay"}
              </p>
              <p className="font-bold text-green-700">{fmt(order!.total)}</p>
            </div>
          </div>
          {!isOnline && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-[13px] text-emerald-800">
              Please keep <strong>{fmt(order!.total)}</strong> ready at the time of delivery.
            </div>
          )}
          {isOnline && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-[13px] text-green-700">
              ✓ Payment of <strong>{fmt(order!.total)}</strong> has been received successfully.
            </div>
          )}
        </div>
        </div>

        {/* Track Order */}
        <div className="bg-white rounded-2xl border border-[#d1fae5] shadow-sm p-6 text-center">
          <p className="text-[14px] text-[#555] mb-3">
            To track your order status and delivery updates, please log in or create an account.
          </p>
          <Link
            href={user ? "/account-order" : "/account-register"}
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-[13px] font-bold uppercase tracking-wider transition-colors"
          >
            {user ? "View My Orders" : "Sign Up to Track Order"}
          </Link>
        </div>
      </main>
    </div>
  );
}
