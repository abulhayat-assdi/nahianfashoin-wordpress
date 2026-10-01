"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { parsePrice } from "@/lib/parse-price";
import SizeChart from "./SizeChart";
import { Minus, Plus } from "lucide-react";

type ProductInfo = {
  id: string;
  name: string;
  price: string;
  image?: string;
  detail?: string;
  originalPrice?: string;
  discount?: string;
  category?: string;
};

export function ProductActionButtons({
  product,
  whatsappNumber,
  phoneNumber,
  colors = [],
  sizes = [],
  colorImageOffset = 0,
}: {
  product?: ProductInfo;
  whatsappNumber?: string;
  phoneNumber?: string;
  colors?: string[];
  sizes?: { size: string; available: boolean }[];
  colorImageOffset?: number;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(colors.length > 0 ? 0 : null);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.find((s) => s.available)?.size || null
  );

  const isImageUrl = (c: string) => c.startsWith("http") || c.startsWith("/");
  const urlColorIndices = colors.reduce<number[]>((acc, c, i) => {
    if (isImageUrl(c)) acc.push(i);
    return acc;
  }, []);

  const selectColor = (idx: number) => {
    setSelectedColorIdx(idx);
    const urlIdx = urlColorIndices.indexOf(idx);
    if (urlIdx !== -1) {
      window.dispatchEvent(new CustomEvent("gallery:goto", { detail: colorImageOffset + urlIdx }));
    }
  };

  const productData: ProductInfo = product ?? {
    id: "demo",
    name: "Premium Panjabi",
    price: "৳1,450",
    detail: "",
    image: "",
    originalPrice: "",
    discount: "",
  };

  const addToCart = (qty = quantity) => {
    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = existing.findIndex((i: any) => i.id === productData.id);
    const cartMeta = {
      selectedSize: selectedSize || undefined,
      selectedColorIdx: selectedColorIdx ?? undefined,
      availableSizes: sizes.length > 0 ? sizes : undefined,
      availableColors: colors.length > 0 ? colors : undefined,
    };
    if (idx > -1) {
      existing[idx] = { ...existing[idx], ...cartMeta, quantity: (existing[idx].quantity || 1) + qty };
    } else {
      existing.push({ ...productData, ...cartMeta, quantity: qty });
    }
    localStorage.setItem("cart", JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent("cart:add", { detail: { ...productData } }));

    const price = parsePrice(productData.price);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "add_to_cart",
      event_id: crypto.randomUUID(),
      ecommerce: {
        currency: "BDT",
        value: price * qty,
        items: [{ item_id: productData.id, item_name: productData.name, item_brand: "Nahian Fashion", item_category: productData.category || "Fashion", price, quantity: qty }],
      },
    });
  };

  const handleBuyNow = () => {
    localStorage.setItem("sv_buy_now_item", JSON.stringify({
      ...productData,
      quantity,
      selectedSize: selectedSize || undefined,
      selectedColorIdx: selectedColorIdx ?? undefined,
      availableSizes: sizes.length > 0 ? sizes : undefined,
      availableColors: colors.length > 0 ? colors : undefined,
    }));
    router.push(`/checkout?buyNow=${productData.id}`);
  };

  const waNumber = whatsappNumber?.replace(/\D/g, "") || "";
  const telNumber = phoneNumber?.replace(/[\s\-\(\)]/g, "") || "";
  const telHref = telNumber ? `tel:${telNumber}` : "tel:";
  const colorLabel = selectedColorIdx !== null ? `Color ${selectedColorIdx + 1}` : "";
  const waMessage = encodeURIComponent(
    `হ্যালো! আমি অর্ডার করতে চাই:\n\nপণ্য: ${productData.name}\nপরিমাণ: ${quantity}\n${colorLabel ? `রং: ${colorLabel}\n` : ""}${selectedSize ? `সাইজ: ${selectedSize}\n` : ""}মূল্য: ${productData.price}`
  );
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : `https://wa.me/?text=${waMessage}`;

  return (
    <div className="mt-2 space-y-2">
      {/* Color Selector */}
      {colors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold text-[#1a1a1a]">
              Color:{" "}
              <span className="text-[#555] font-normal">
                {selectedColorIdx !== null
                  ? isImageUrl(colors[selectedColorIdx])
                    ? `Color ${selectedColorIdx + 1}`
                    : colors[selectedColorIdx]
                  : "Select"}
              </span>
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {colors.map((colorVal, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectColor(idx)}
                className={`relative w-8 h-8 overflow-hidden transition-all flex-shrink-0 border-2 ${
                  selectedColorIdx === idx
                    ? "border-[#1a3c2e] shadow-sm"
                    : "border-[#ddd] hover:border-[#999]"
                }`}
              >
                {isImageUrl(colorVal) ? (
                  <img src={colorVal} alt={`Color ${idx + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="block w-full h-full" style={{ backgroundColor: colorVal }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selector */}
      {sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold text-[#1a1a1a] flex items-center gap-1.5">
              Size: <span className="text-[#555] font-normal">{selectedSize || "Select"}</span>
              {selectedSize && (() => {
                const isAvail = sizes.find(s => s.size === selectedSize)?.available ?? true;
                return (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 border ${isAvail ? "text-green-700 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                    {isAvail ? "Available" : "Stock Out"}
                  </span>
                );
              })()}
            </span>
            <SizeChart />
          </div>
          <div className="flex gap-2 flex-wrap">
            {sizes.map(({ size, available }) => (
              <button
                key={size}
                type="button"
                disabled={!available}
                onClick={() => setSelectedSize(size)}
                className={`min-w-[40px] px-2 py-1.5 text-[12px] font-semibold border rounded transition-all ${
                  selectedSize === size
                    ? "bg-[#1a3c2e] text-white border-[#1a3c2e]"
                    : "bg-white text-[#1a1a1a] border-[#ddd] hover:border-[#1a3c2e]"
                } ${!available ? "opacity-40 line-through cursor-not-allowed" : ""}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[#1a1a1a]">Qty:</span>
        <div className="flex items-center border border-[#ddd] w-fit">
          <button
            type="button"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="px-2 py-1 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
          >
            <Minus size={11} />
          </button>
          <span className="px-3 py-1 text-[13px] font-semibold text-[#1a1a1a] min-w-[32px] text-center border-x border-[#ddd]">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(q => q + 1)}
            className="px-2 py-1 text-[#666] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
          >
            <Plus size={11} />
          </button>
        </div>
      </div>

      {/* CTA Buttons — 2×2 grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Row 1: Buy Now | Order on WhatsApp */}
        <button
          type="button"
          onClick={handleBuyNow}
          className="flex items-center justify-center py-2.5 bg-[#1a1a1a] text-white text-[13px] font-bold hover:bg-[#333] transition-colors rounded-sm"
        >
          অর্ডার করুন
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#20bd5a] transition-colors rounded-sm"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>

        {/* Row 2: Add to Cart | Call for Order */}
        <button
          type="button"
          onClick={() => addToCart(quantity)}
          className="flex items-center justify-center py-2.5 border-2 border-[#1a3c2e] text-[#1a3c2e] text-[12px] font-bold uppercase tracking-wide hover:bg-[#1a3c2e] hover:text-white transition-colors rounded-sm"
        >
          Add to Cart
        </button>
        <a
          href={telHref}
          className="flex items-center justify-center gap-1.5 py-2.5 bg-[#1a3c2e] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-[#0f2a1e] transition-colors rounded-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Call to Order
        </a>
      </div>

      {/* Trust badges */}
      <div className="flex items-stretch justify-between pt-2 border-t border-[#f0f0f0]">
        <div className="flex flex-col items-center gap-1 text-center flex-1 px-0.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 text-[#1a3c2e]">
            <rect x="2" y="6" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <path d="M6 14h4" />
          </svg>
          <p className="text-[10px] font-semibold text-[#222] leading-tight">Cash On Delivery</p>
          <p className="text-[9px] text-[#888] leading-tight">Pay when you get</p>
        </div>

        <div className="w-px bg-[#f0f0f0] self-stretch mx-0.5" />

        <div className="flex flex-col items-center gap-1 text-center flex-1 px-0.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 text-[#1a3c2e]">
            <path d="M1 4v6h6" />
            <path d="M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          <p className="text-[10px] font-semibold text-[#222] leading-tight">Easy Return</p>
          <p className="text-[9px] text-[#888] leading-tight">Within 7 Days</p>
        </div>

        <div className="w-px bg-[#f0f0f0] self-stretch mx-0.5" />

        <div className="flex flex-col items-center gap-1 text-center flex-1 px-0.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 text-[#1a3c2e]">
            <path d="M7 16V4m0 0L3 8m4-4l4 4" />
            <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <p className="text-[10px] font-semibold text-[#222] leading-tight">Easy Exchange</p>
          <p className="text-[9px] text-[#888] leading-tight">Hassle Free</p>
        </div>
      </div>
    </div>
  );
}
