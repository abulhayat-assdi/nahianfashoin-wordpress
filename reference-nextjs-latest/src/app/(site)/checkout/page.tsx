"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, ShoppingCart, Truck, ArrowLeft, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import SiteConfirmModal from "@/components/ui/SiteConfirmModal";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const SHIPPING_OPTIONS = [
  { value: "inside", label: "ঢাকার ভিতরে", charge: 70 },
  { value: "outside", label: "ঢাকার বাইরে", charge: 120 },
];

function CheckoutContent() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  
  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    itemId: "",
    title: "",
    message: ""
  });
  const [shippingCharge, setShippingCharge] = useState(120);
  const [user, setUser] = useState<any>(null);
  const [phoneError, setPhoneError] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const draftSessionId = useRef<string>('');
  const isPlacingRef = useRef(false);
  const cartItemsRef = useRef<any[]>([]);

  // Size & Color selections per item
  const [itemSelections, setItemSelections] = useState<Record<string, { size?: string | null; colorIdx?: number | null }>>({});
  const [selectionErrors, setSelectionErrors] = useState<Record<string, { size?: boolean; color?: boolean }>>({});

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    shipping_zone: "outside",
    shipping_method: "Cash on Delivery",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const buyNowId = searchParams.get("buyNow");

  // ── Draft (incomplete order) tracking ───────────────────────────────────────
  // Initialise a persistent session ID so we can upsert one draft per visit.
  useEffect(() => {
    const stored = localStorage.getItem('sv_draft_session');
    if (stored) {
      draftSessionId.current = stored;
    } else {
      const id = crypto.randomUUID();
      localStorage.setItem('sv_draft_session', id);
      draftSessionId.current = id;
    }
  }, []);

  // Keep a ref so the debounce callback always sees the latest cart without
  // being listed as a dependency (avoids re-registering the timer on every render).
  useEffect(() => { cartItemsRef.current = cartItems; }, [cartItems]);

  const saveDraft = useCallback(async () => {
    if (isPlacingRef.current || !draftSessionId.current) return;
    if (!form.name && !form.phone && !form.address) return;
    try {
      await fetch('/api/orders/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: draftSessionId.current,
          name: form.name || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          shippingZone: form.shipping_zone,
          items: cartItemsRef.current.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
          })),
        }),
      });
    } catch { /* fire-and-forget — never block the UI */ }
  }, [form.name, form.phone, form.address, form.shipping_zone]);

  // Debounce: save draft 1.5 s after the user stops typing in any form field.
  useEffect(() => {
    const timer = setTimeout(saveDraft, 1500);
    return () => clearTimeout(timer);
  }, [saveDraft]);
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const checkUser = async () => {
      // 1. Try to load from localStorage first (for repeat guests/users)
      const savedInfo = localStorage.getItem("sv_checkout_info");
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo);
          setForm(prev => ({
            ...prev,
            name: parsed.name || prev.name,
            phone: parsed.phone || prev.phone,
            address: parsed.address || prev.address,
          }));
        } catch (e) {}
      }

      // 2. If logged in, profile from DB takes priority
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.user) {
        setUser(sessionData.user);
        const profileRes = await fetch('/api/customer/profile');
        const profileData = await profileRes.json();
        if (profileData.customer) {
          setForm(prev => ({
            ...prev,
            name: profileData.customer.name || prev.name,
            phone: profileData.customer.phone || prev.phone,
            address: profileData.customer.address || prev.address,
          }));
        }
      }
    };
    checkUser();

    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => setWhatsappNumber(data.whatsapp_number || null))
      .catch(() => {});
  }, []);

  // Removed applySuggestion as we now auto-fill or use native autocomplete

  useEffect(() => {
    const load = async () => {
      const saved = localStorage.getItem("cart");
      const buyNowRaw = localStorage.getItem("sv_buy_now_item");

      // Parse sv_buy_now_item once
      let buyNowItem: any = null;
      if (buyNowRaw) {
        try { buyNowItem = JSON.parse(buyNowRaw); } catch (e) {}
      }

      let items: any[] = [];

      if (buyNowId) {
        // Priority 1: sv_buy_now_item — always freshly set by the product page with
        // current selections AND availableColors/availableSizes metadata.
        if (buyNowItem && buyNowItem.id === buyNowId) {
          items = [buyNowItem];
        }
        // Priority 2: Fall back to main cart only when sv_buy_now_item is unavailable
        if (items.length === 0 && saved) {
          try {
            const parsed = JSON.parse(saved);
            items = (parsed as any[]).filter((item: any) => item.id === buyNowId);
          } catch (e) {}
        }
      } else if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) items = parsed;
        } catch (e) {}
      }

      // ── Enrich items missing color/size metadata from server ──────────────────
      // Old cart items (added before this feature) don't have availableColors /
      // availableSizes. Fetch fresh product meta for those items so the
      // size & color selection UI renders and the values are saved to the order.
      const needsMeta = items.filter((item: any) => !item.availableColors && !item.availableSizes);
      if (needsMeta.length > 0) {
        try {
          const res = await fetch('/api/products/meta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: needsMeta.map((i: any) => i.id) }),
          });
          if (res.ok) {
            const { data: metaList } = await res.json();
            const metaMap: Record<string, any> = {};
            for (const m of metaList) metaMap[m.id] = m;
            items = items.map((item: any) => {
              if (metaMap[item.id] && !item.availableColors && !item.availableSizes) {
                const meta = metaMap[item.id];
                const colors: string[] = Array.isArray(meta.colors) ? meta.colors : [];
                const sizes: { size: string; available: boolean }[] = Array.isArray(meta.sizes) ? meta.sizes : [];
                return {
                  ...item,
                  availableColors: colors.length > 0 ? colors : undefined,
                  availableSizes: sizes.length > 0 ? sizes : undefined,
                  selectedColorIdx: colors.length > 0 ? 0 : undefined,
                  selectedSize: sizes.length > 0 ? (sizes[0]?.size ?? undefined) : undefined,
                };
              }
              return item;
            });
          }
        } catch (e) { /* non-fatal — proceed without meta */ }
      }
      // ─────────────────────────────────────────────────────────────────────────

      setCartItems(items);
      initSelections(items);
      setLoading(false);

      // GA4/GTM begin_checkout — lets us see where customers drop off in the funnel
      if (items.length > 0) {
        const value = items.reduce((acc: number, it: any) => {
          const p = parseFloat(String(it.price).replace(/[^0-9.]/g, "")) || 0;
          return acc + p * (it.quantity || 1);
        }, 0);
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({ ecommerce: null });
        (window as any).dataLayer.push({
          event: "begin_checkout",
          event_id: crypto.randomUUID(),
          ecommerce: {
            currency: "BDT",
            value,
            items: items.map((it: any) => ({
              item_id: it.id,
              item_name: it.name,
              item_brand: "Nahian Fashion",
              item_category: it.category || "Fashion",
              price: parseFloat(String(it.price).replace(/[^0-9.]/g, "")) || 0,
              quantity: it.quantity || 1,
            })),
          },
        });
      }
    };

    load();
  }, [buyNowId]);

  const initSelections = (items: any[]) => {
    const initial: Record<string, { size?: string | null; colorIdx?: number | null }> = {};
    for (const item of items) {
      // Never preselect a stock-out size (old cart items may carry one)
      const sizeAvailable = !item.selectedSize
        || (item.availableSizes?.find((s: any) => s.size === item.selectedSize)?.available ?? true);
      initial[item.id] = {
        size: sizeAvailable ? (item.selectedSize || null) : null,
        colorIdx: item.availableColors?.length === 1 ? 0 : (item.selectedColorIdx ?? null),
      };
    }
    setItemSelections(initial);
  };


  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    setCartItems(updated);
    
    if (!buyNowId) {
      localStorage.setItem("cart", JSON.stringify(updated));
    }
  };

  const removeItem = (id: string) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    setConfirmModal({
      isOpen: true,
      itemId: id,
      title: "পণ্যটি বাদ দিতে চান?",
      message: `আপনি কি নিশ্চিত যে আপনার অর্ডার থেকে "${item.name}" বাদ দিতে চান?`
    });
  };

  const confirmRemove = () => {
    const id = confirmModal.itemId;
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    
    if (!buyNowId) {
      localStorage.setItem("cart", JSON.stringify(updated));
    }
    window.dispatchEvent(new CustomEvent("cart:add"));
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
    return acc + price * item.quantity;
  }, 0);

  const originalSubtotal = cartItems.reduce((acc, item) => {
    const orig = item.originalPrice ? parseFloat(item.originalPrice.replace(/[^0-9.]/g, "")) : 0;
    const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
    return acc + (orig > price ? orig : price) * item.quantity;
  }, 0);
  const productDiscount = originalSubtotal - subtotal;

  const couponDiscount = appliedCoupon?.discount ?? 0;
  const discount = couponDiscount;
  const grandTotal = subtotal - couponDiscount + shippingCharge;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setIsApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "কুপনটি সঠিক নয়।");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.code, discount: data.discount });
        setCouponError("");
      }
    } catch {
      setCouponError("কুপনটি ব্যবহার করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const normalizePhone = (raw: string): string => {
    let num = raw.replace(/[\s\-\(\)]/g, '');
    if (num.startsWith('+880')) num = '0' + num.slice(4);
    else if (num.startsWith('880')) num = '0' + num.slice(3);
    return num;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");
    if (cartItems.length === 0) {
      setOrderError("আপনার কার্ট খালি!");
      return;
    }

    const normalizedPhone = normalizePhone(form.phone);
    const phoneRegex = /^01[3-9][0-9]{8}$/;
    if (!normalizedPhone || !phoneRegex.test(normalizedPhone)) {
      setPhoneError(true);
      phoneRef.current?.focus();
      return;
    }

    if (!form.name || !form.address) {
      setOrderError("নাম ও ঠিকানা পূরণ করুন।");
      return;
    }

    // Validate size & color selections
    const newErrors: Record<string, { size?: boolean; color?: boolean }> = {};
    let hasSelectionError = false;
    for (const item of cartItems) {
      const sel = itemSelections[item.id] || {};
      if (item.availableSizes?.length > 0 && !sel.size) {
        newErrors[item.id] = { ...newErrors[item.id], size: true };
        hasSelectionError = true;
      }
      if (item.availableColors?.length > 1 && (sel.colorIdx === undefined || sel.colorIdx === null)) {
        newErrors[item.id] = { ...newErrors[item.id], color: true };
        hasSelectionError = true;
      }
    }
    if (hasSelectionError) {
      setSelectionErrors(newErrors);
      return;
    }

    setIsPlacingOrder(true);
    isPlacingRef.current = true;

    try {
      // 1. Call the server-side API to create the order
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user?.id || null,
          name: form.name,
          phone: normalizedPhone,
          address: form.address,
          items: cartItems.map(item => {
            const colorIdx = itemSelections[item.id]?.colorIdx ?? null;
            const colorUrl = (item.availableColors?.length > 0 && colorIdx !== null)
              ? item.availableColors[colorIdx]
              : null;
            return {
              productId: item.id,
              quantity: item.quantity,
              size: itemSelections[item.id]?.size || undefined,
              color: colorUrl || undefined,
            };
          }),
          paymentMethod: 'cash',
          couponCode: appliedCoupon?.code || undefined,
          shippingZone: form.shipping_zone
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to create order');
      }

      const finalOrderId = result.orderId; // This is the server-generated CTA-XXXX ID

      // 2. Save to localStorage fallback for Thank You page
      const lastOrderData = {
        orderId: finalOrderId,
        name: form.name,
        phone: normalizedPhone,
        address: form.address,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image || '',
          quantity: item.quantity
        })),
        subtotal: subtotal,
        shipping: shippingCharge,
        discount: discount,
        total: grandTotal,
        paymentMethod: 'cash',
        amountPaid: 0,
        placedAt: new Date().toISOString()
      };
      localStorage.setItem("sv_last_order", JSON.stringify(lastOrderData));

      // Store coupon code for GA4 purchase event on thank-you page
      if (appliedCoupon?.code) {
        localStorage.setItem("sv_last_coupon_code", appliedCoupon.code);
      } else {
        localStorage.removeItem("sv_last_coupon_code");
      }

      // 4. Success - Remove ONLY ordered items from global cart
      const savedCartRaw = localStorage.getItem("cart");
      const savedCart = savedCartRaw ? JSON.parse(savedCartRaw) : [];
      const orderedIds = cartItems.map(i => i.id);
      const remainingCart = savedCart.filter((item: any) => !orderedIds.includes(item.id));
      
      localStorage.setItem("cart", JSON.stringify(remainingCart));
      localStorage.removeItem("sv_buy_now_item"); // Always clean up temporary storage
      
      // Save info for next time
      localStorage.setItem("sv_checkout_info", JSON.stringify({
        name: form.name,
        phone: normalizedPhone,
        address: form.address,
      }));

      window.dispatchEvent(new CustomEvent("cart:add")); // notify header to refresh count

      // Delete the draft now that the real order is placed.
      const sessId = draftSessionId.current;
      if (sessId) {
        fetch('/api/orders/draft', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessId }),
        }).catch(() => {});
        localStorage.removeItem('sv_draft_session');
        draftSessionId.current = '';
      }

      router.push(`/thank-you/${finalOrderId}`);
      
    } catch (err: any) {
      console.error("Order error:", err);
      // Server errors arrive in Bengali; fall back to a generic Bengali message
      // for network failures (TypeError: Failed to fetch etc.)
      const message =
        err?.message && !/failed to fetch|networkerror|load failed/i.test(err.message)
          ? err.message
          : "অর্ডার সম্পন্ন করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।";
      setOrderError(message);
    } finally {
      setIsPlacingOrder(false);
      isPlacingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3c2e]" />
        <p className="text-[#666]">চেকআউট প্রস্তুত করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-3 md:py-16">
      <div className="mx-auto max-w-[1280px] px-3 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-3 md:gap-8 items-start">

          {/* Left: Your Order */}
          <div className="bg-white rounded-[12px] shadow-sm overflow-hidden border border-[#eee]">
            <div className="bg-[#1a3c2e] px-4 py-3 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-white" />
              <h2 className="text-[16px] font-bold text-white">আপনার অর্ডার</h2>
            </div>
            <div className="p-3 md:p-8">
              {/* Mobile: Card list (no horizontal scroll) */}
              <div className="md:hidden">
                {cartItems.length === 0 ? (
                  <div className="py-16 text-center text-[#999]">
                    আপনার কার্ট খালি। <Link href="/" className="text-[#1a3c2e] underline ml-1">কেনাকাটা চালিয়ে যান</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map(item => {
                      const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
                      const origPrice = item.originalPrice ? parseFloat(item.originalPrice.replace(/[^0-9.]/g, "")) : null;
                      const hasDiscount = origPrice && origPrice > price;
                      return (
                        <div key={item.id} className="flex gap-3 p-3 border border-[#f0f0f0] rounded-lg">
                          <div className="w-[60px] h-[60px] flex-shrink-0 bg-[#f8f5f0] rounded-lg overflow-hidden border border-[#eee]">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ShoppingCart size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#222] leading-snug">{item.name}</p>
                            <div className="mt-0.5">
                              {hasDiscount && <span className="text-[11px] text-[#999] line-through mr-1">{origPrice} টাকা</span>}
                              <span className="text-[13px] text-[#1a3c2e] font-bold">{price} টাকা</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center border border-[#ddd] rounded-full px-1 h-8">
                                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-full flex items-center justify-center text-[#999] hover:text-black transition-colors">-</button>
                                <span className="w-7 text-center font-bold text-[13px] text-[#222]">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-full flex items-center justify-center text-[#999] hover:text-black transition-colors">+</button>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[13px] font-bold text-[#1a3c2e]">{price * item.quantity} টাকা</span>
                                <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f5f5f5] text-[14px] text-[#1a3c2e] font-bold uppercase tracking-wider">
                      <th className="px-4 py-3 border-b border-[#eee]">#</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Image</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Name</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Unit Price</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Qty</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Total</th>
                      <th className="px-4 py-3 border-b border-[#eee]">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="text-[15px]">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-20 text-center text-[#999]">
                          আপনার কার্ট খালি। <Link href="/" className="text-brand-gold underline ml-2">কেনাকাটা চালিয়ে যান</Link>
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item, idx) => {
                        const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
                        const origPrice = item.originalPrice ? parseFloat(item.originalPrice.replace(/[^0-9.]/g, "")) : null;
                        const hasDiscount = origPrice && origPrice > price;
                        return (
                          <tr key={item.id} className="border-b border-[#f5f5f5] hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">{idx + 1}</td>
                            <td className="px-4 py-4">
                              <div className="w-16 h-16 bg-[#f8f5f0] rounded-lg overflow-hidden border border-[#eee]">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ShoppingCart size={24} />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-medium text-[#222] min-w-[150px]">{item.name}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {hasDiscount && (
                                <div className="text-[12px] text-[#999] line-through">{origPrice} টাকা</div>
                              )}
                              <div className="text-[#1a3c2e] font-bold">{price} টাকা</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center border border-[#ddd] rounded-full w-fit px-1 h-9">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-8 h-full flex items-center justify-center text-[#999] hover:text-black transition-colors"
                                >-</button>
                                <span className="w-8 text-center font-bold text-[#222]">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-8 h-full flex items-center justify-center text-[#999] hover:text-black transition-colors"
                                >+</button>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {hasDiscount && (
                                <div className="text-[12px] text-[#999] line-through">{origPrice! * item.quantity} টাকা</div>
                              )}
                              <div className="text-[#1a3c2e] font-bold">{price * item.quantity} টাকা</div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="flex flex-col items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={18} />
                                <span className="text-[10px] font-bold uppercase">বাদ দিন</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Size & Color Selection */}
              {cartItems.some(item => item.availableSizes?.length > 0 || item.availableColors?.length > 1) && (
                <div className="mt-6 border-t border-[#f0f0f0] pt-6 space-y-4">
                  <h3 className="text-[15px] font-bold text-[#1a1a1a]">সাইজ ও কালার নির্বাচন</h3>
                  {cartItems.map(item => {
                    const hasSizes = item.availableSizes?.length > 0;
                    const hasMultipleColors = item.availableColors?.length > 1;
                    if (!hasSizes && !hasMultipleColors) return null;
                    const sel = itemSelections[item.id] || {};
                    const err = selectionErrors[item.id] || {};
                    return (
                      <div key={item.id} className={`p-4 rounded-[8px] border ${(err.size || err.color) ? "border-red-300 bg-red-50" : "border-[#eee] bg-[#fafafa]"}`}>
                        <p className="text-[13px] font-semibold text-[#555] mb-3">{item.name}</p>
                        {hasSizes && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-[13px] font-bold text-[#1a1a1a]">
                                সাইজ: <span className="text-[#555] font-normal">{sel.size || "—"}</span>
                              </span>
                              {sel.size && (() => {
                                const isAvail = item.availableSizes.find((s: any) => s.size === sel.size)?.available ?? true;
                                return (
                                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 border ${isAvail ? "text-green-700 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                                    {isAvail ? "স্টকে আছে" : "স্টক আউট"}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {item.availableSizes.map(({ size, available }: any) => (
                                <button
                                  key={size}
                                  type="button"
                                  disabled={!available}
                                  onClick={() => { setItemSelections(prev => ({ ...prev, [item.id]: { ...prev[item.id], size } })); setSelectionErrors(prev => ({ ...prev, [item.id]: { ...prev[item.id], size: false } })); }}
                                  className={`min-w-[44px] px-3 py-1.5 text-[13px] font-semibold border transition-all ${sel.size === size ? "bg-[#1a3c2e] text-white border-[#1a3c2e]" : "bg-white text-[#1a1a1a] border-[#ddd] hover:border-[#1a3c2e]"} ${!available ? "opacity-40 line-through cursor-not-allowed" : ""}`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                            {err.size && <p className="text-red-500 text-[12px] mt-1.5 font-medium">অর্ডার করার পূর্বে অনুগ্রহ করে সাইজ নির্বাচন করুন</p>}
                          </div>
                        )}
                        {hasMultipleColors && (
                          <div>
                            <span className="text-[13px] font-bold text-[#1a1a1a] block mb-2">
                              কালার: <span className="text-[#555] font-normal">{sel.colorIdx != null ? `কালার ${sel.colorIdx + 1}` : "—"}</span>
                            </span>
                            <div className="flex gap-2 flex-wrap">
                              {item.availableColors.map((imgUrl: string, idx: number) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => { setItemSelections(prev => ({ ...prev, [item.id]: { ...prev[item.id], colorIdx: idx } })); setSelectionErrors(prev => ({ ...prev, [item.id]: { ...prev[item.id], color: false } })); }}
                                  className={`relative w-12 h-12 border-2 overflow-hidden transition-all ${sel.colorIdx === idx ? "border-[#1a3c2e] shadow-md" : "border-[#ddd] hover:border-[#999]"}`}
                                >
                                  <img src={imgUrl} alt={`Color ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                            {err.color && <p className="text-red-500 text-[12px] mt-1.5 font-medium">অর্ডার করার পূর্বে অনুগ্রহ করে কালার নির্বাচন করুন</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 space-y-2 w-full md:max-w-[400px] md:ml-auto">
                {/* Coupon Code Input */}
                <div className="pb-3 border-b border-[#f0f0f0]">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[8px] px-4 py-2.5">
                      <div className="flex items-center gap-2 text-green-700 text-[14px] font-bold">
                        <CheckCircle2 size={16} />
                        <span>কুপন <span className="font-mono">{appliedCoupon.code}</span> ব্যবহার করা হয়েছে — ৳{appliedCoupon.discount.toLocaleString()} ছাড়</span>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} className="text-red-500 text-[12px] font-bold hover:underline ml-2">মুছুন</button>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <input
                        type="text"
                        placeholder="কুপন কোড লিখুন"
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                        className="flex-1 min-w-0 h-[38px] px-2.5 rounded-[6px] border border-[#ddd] outline-none focus:border-[#1a3c2e] text-[13px] uppercase tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="shrink-0 h-[38px] px-3 bg-[#1a3c2e] text-white rounded-[6px] text-[12px] font-bold hover:bg-[#0f2a1e] transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {isApplyingCoupon ? <Loader2 size={14} className="animate-spin" /> : "প্রয়োগ করুন"}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-red-500 text-[12px] font-medium mt-1">{couponError}</p>}
                </div>

                <div className="flex justify-between text-[13px] text-[#555]">
                  <span>সাবটোটাল:</span>
                  <div className="text-right">
                    {productDiscount > 0 && (
                      <div className="text-[11px] text-[#999] line-through">৳{originalSubtotal.toLocaleString()}</div>
                    )}
                    <span className="font-bold text-[#222]">৳{subtotal.toLocaleString()}</span>
                  </div>
                </div>
                {productDiscount > 0 && (
                  <div className="flex justify-between text-[13px] text-green-600">
                    <span>পণ্য ডিসকাউন্ট:</span>
                    <span className="font-bold">−৳{productDiscount.toLocaleString()}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[13px] text-green-600">
                    <span>কুপন ({appliedCoupon?.code}):</span>
                    <span className="font-bold">−৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                {(productDiscount > 0 || couponDiscount > 0) && (
                  <div className="flex justify-between text-[12px] font-semibold text-green-700 bg-green-50 rounded-[6px] px-2.5 py-1.5 -mx-1">
                    <span>সর্বমোট সঞ্চয়:</span>
                    <span>−৳{(productDiscount + couponDiscount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[13px] text-[#555]">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-bold text-[#222]">৳{shippingCharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[18px] md:text-[22px] font-bold text-[#222] pt-2 border-t border-[#eee]">
                  <span>সর্বমোট:</span>
                  <span className="text-[#1a3c2e]">৳{grandTotal.toLocaleString()}</span>
                </div>
                <p className="text-red-600 text-[12px] md:text-[13px] font-bold text-center pt-1.5">
                  নিশ্চিত হয়ে অর্ডার করবেন। অযথা অর্ডার করবেন না।
                </p>
              </div>

              <div className="mt-4">
                <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-[6px] text-[12px] font-bold uppercase tracking-wide hover:opacity-80 transition-opacity">
                  <ArrowLeft size={14} /> কেনাকাটায় ফিরে যান
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Delivery Info */}
          <div className="bg-white rounded-[12px] shadow-sm overflow-hidden border border-[#eee]">
            <div className="bg-[#1a1a1a] px-4 py-3 flex items-center gap-2 border-b border-[#f0f0f0]">
              <Truck className="w-5 h-5 text-white" />
              <h2 className="text-[16px] font-bold text-white">ডেলিভারি তথ্য</h2>
            </div>
            <div className="p-3 md:p-8">
              <form onSubmit={handlePlaceOrder} className="space-y-3 md:space-y-6">
              <div>
                <label className="block text-[13px] font-bold text-[#555] mb-1">আপনার নাম*</label>
                <input
                  required
                  type="text"
                  placeholder="আপনার নাম লিখুন"
                  autoComplete="name"
                  className="w-full h-[42px] px-3 rounded-[8px] border border-[#ddd] outline-none focus:border-[#1a3c2e] transition-colors text-[14px]"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#555] mb-1">আপনার মোবাইল নম্বর*</label>
                <input
                  required
                  type="tel"
                  ref={phoneRef}
                  placeholder="01XXXXXXXXX"
                  autoComplete="tel"
                  className={`w-full h-[42px] px-3 rounded-[8px] border ${phoneError ? 'border-red-500' : 'border-[#ddd]'} outline-none focus:border-[#1a3c2e] transition-colors text-[14px]`}
                  value={form.phone}
                  onChange={e => {
                    setForm({...form, phone: e.target.value.replace(/[^0-9+\-]/g, '')});
                    if (phoneError) setPhoneError(false);
                  }}
                />
                {phoneError && (
                  <p className="text-red-500 text-[12px] font-bold mt-1">
                    অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর দিন — ১১ ডিজিটের বাংলাদেশি নম্বর হতে হবে (যেমন: 01XXXXXXXXX)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#555] mb-1">আপনার ঠিকানা*</label>
                <textarea
                  required
                  placeholder="আপনার সম্পূর্ণ ঠিকানা লিখুন (বাসা নম্বর, রোড নম্বর, এলাকা, থানা, জেলা)"
                  autoComplete="street-address"
                  className="w-full h-[80px] p-3 rounded-[8px] border border-[#ddd] outline-none focus:border-[#1a3c2e] transition-colors text-[14px] resize-none"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#555] mb-2">ডেলিভারি এলাকা*</label>
                <div className="space-y-2">
                  {SHIPPING_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2.5 p-2.5 rounded-[8px] border-2 cursor-pointer transition-all ${
                        form.shipping_zone === opt.value
                          ? "border-[#1a3c2e] bg-[#f0f5f2]"
                          : "border-[#ddd] hover:border-[#aaa]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_zone"
                        value={opt.value}
                        checked={form.shipping_zone === opt.value}
                        onChange={() => {
                          setForm({ ...form, shipping_zone: opt.value });
                          setShippingCharge(opt.charge);
                        }}
                        className="w-4 h-4 accent-[#1a3c2e]"
                      />
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[14px] font-semibold text-[#222]">{opt.label}</span>
                        <span className="text-[14px] font-bold text-[#1a3c2e]">৳{opt.charge}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#555] mb-1">ডেলিভারি পদ্ধতি*</label>
                <select
                  required
                  className="w-full h-[42px] px-3 rounded-[8px] border border-[#ddd] outline-none focus:border-[#1a3c2e] transition-colors text-[14px] bg-white appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                  value={form.shipping_method}
                  onChange={e => setForm({...form, shipping_method: e.target.value})}
                >
                  <option value="Cash on Delivery">ক্যাশ অন ডেলিভারি (Cash on Delivery)</option>
                </select>
              </div>

              {orderError && (
                <div className="bg-red-50 border border-red-200 rounded-[8px] px-4 py-3 text-[13px] font-semibold text-red-600">
                  <p>{orderError}</p>
                  {orderError.includes("ইতিমধ্যে একটি অর্ডার") && (
                    <>
                      <p className="mt-1">এর আগে অর্ডার করতে চাইলে হোয়াটস এপ এ যোগাযোগ করুন।</p>
                      <a
                        href={buildWhatsAppUrl(whatsappNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center justify-center gap-2 w-full h-[42px] bg-[#25D366] text-white rounded-[6px] text-[13px] font-bold hover:opacity-90 transition-opacity"
                      >
                        <MessageCircle size={16} /> হোয়াটসঅ্যাপে মেসেজ করুন
                      </a>
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isPlacingOrder || cartItems.length === 0}
                className="w-full h-[48px] md:h-[60px] bg-[#1a3c2e] text-white rounded-[8px] text-[15px] md:text-[18px] font-bold uppercase tracking-wide hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="animate-spin" />
                    অর্ডার সম্পন্ন হচ্ছে...
                  </>
                ) : (
                  "অর্ডার কনফার্ম করুন"
                )}
              </button>
            </form>
          </div>

          </div>
        </div>
      </div>
      <SiteConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        confirmText="হ্যাঁ, বাদ দিন"
        cancelText="বাতিল করুন"
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">চেকআউট লোড হচ্ছে...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
