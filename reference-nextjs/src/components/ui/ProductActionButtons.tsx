"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { parsePrice } from "@/lib/parse-price";

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
}: {
  product?: ProductInfo;
  whatsappNumber?: string;
  phoneNumber?: string;
}) {
  const router = useRouter();

  const productData: ProductInfo = product ?? {
    id: "p-advent",
    name: "24 Spices of Christmas Advent Calendar",
    price: "Tk 6,000.00",
    detail: "120 Plant-Based Biodegradable Pyramid Bags",
    image: "",
    originalPrice: "",
    discount: ""
  };

  const addToCart = (qty = 1) => {
    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = existing.findIndex((i: ProductInfo) => i.id === productData.id);
    if (idx > -1) {
      existing[idx].quantity = (existing[idx].quantity || 1) + qty;
    } else {
      existing.push({ ...productData, quantity: qty });
    }
    localStorage.setItem("cart", JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent("cart:add", { detail: { ...productData } }));
  };

  const handleAddToCart = () => {
    try {
      addToCart(1);
    } catch (err) {
      console.error("Cart update failed", err);
    }

    const price = parsePrice(productData.price);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        currency: "BDT",
        value: price,
        items: [
          {
            item_id: productData.id,
            item_name: productData.name,
            item_brand: "Nahian Fashion",
            item_category: productData.category || "Tea",
            price,
            quantity: 1,
          },
        ],
      },
    });
  };

  const handleBuyNow = () => {
    localStorage.setItem("sv_buy_now_item", JSON.stringify({ ...productData, quantity: 1 }));
    router.push(`/checkout?buyNow=${productData.id}`);
  };

  const waNumber = whatsappNumber?.replace(/\D/g, "") || "";
  const waMessage = encodeURIComponent(`Hi! I'd like to order: ${productData.name}`);
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : `https://wa.me/?text=${waMessage}`;
  const callHref = phoneNumber ? `tel:${phoneNumber.replace(/\s/g, "")}` : "#";

  return (
    <div className="mt-6 grid grid-cols-2 gap-2 md:gap-3">
      {/* ADD TO CART */}
      <button
        type="button"
        className="flex items-center justify-center gap-1.5 md:gap-2 w-full bg-[#E86A1A] hover:bg-[#d45e0f] text-white py-4 text-[11px] md:text-[13px] font-bold uppercase tracking-wide md:tracking-widest transition-colors overflow-hidden"
        onClick={handleAddToCart}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[16px] w-[16px] md:h-[18px] md:w-[18px] shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="whitespace-nowrap">Add To Cart</span>
      </button>

      {/* BUY NOW */}
      <button
        type="button"
        onClick={handleBuyNow}
        className="relative overflow-hidden w-full bg-[#111] hover:bg-black text-white py-4 text-[11px] md:text-[13px] font-bold uppercase tracking-wide md:tracking-widest transition-colors"
      >
        <span className="buynow-shine" aria-hidden />
        Buy Now
      </button>

      {/* ORDER ON WHATSAPP */}
      <a
        href={waHref}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-1.5 md:gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 text-[10px] md:text-[13px] font-bold uppercase tracking-tight md:tracking-[0.05em] transition-colors overflow-hidden"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px] md:h-[18px] md:w-[18px] shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="whitespace-nowrap">Order On WhatsApp</span>
      </a>

      {/* CALL FOR ORDER */}
      <a
        href={callHref}
        className="flex items-center justify-center gap-1.5 md:gap-2 w-full bg-[#1E3A8A] hover:bg-[#1e3079] text-white py-4 text-[10px] md:text-[13px] font-bold uppercase tracking-tight md:tracking-[0.05em] transition-colors overflow-hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[15px] w-[15px] md:h-[18px] md:w-[18px] shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span className="whitespace-nowrap">Call For Order</span>
      </a>

      <style>{`
        @keyframes buynow-shine {
          0%, 25%  { transform: translateX(-160%) skewX(-20deg); }
          55%, 100% { transform: translateX(260%) skewX(-20deg); }
        }
        .buynow-shine {
          pointer-events: none;
          position: absolute;
          top: 0; left: 0;
          width: 45%; height: 100%;
          background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.14) 50%, transparent 80%);
          animation: buynow-shine 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
