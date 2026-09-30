"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { useState } from "react";
import { parsePrice } from "@/lib/parse-price";

export interface ProductCardProps {
  id: string;
  slug?: string;
  name: string;
  detail: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  reviews: string;
  imageUrl: string;
  category?: string;
  unavailable?: boolean;
  pack?: {
    type: "pouch" | "box" | "gift" | "tin" | "sampler";
    title: string;
    subtitle: string;
    color: string;
    accent: string;
    badge?: string;
  };
}

export default function ProductCard({
  id,
  slug,
  name,
  detail,
  price,
  originalPrice,
  discount,
  reviews,
  imageUrl,
  category,
  unavailable,
  pack,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("cart:add", {
        detail: { id, name, price, image: imageUrl, detail, originalPrice, discount },
      }),
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);

    const numericPrice = parsePrice(price);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        currency: "BDT",
        value: numericPrice,
        items: [
          {
            item_id: id,
            item_name: name,
            item_brand: "Nahian Fashion",
            item_category: category || "Tea",
            price: numericPrice,
            quantity: 1,
          },
        ],
      },
    });
  }

  return (
    <article className="flex w-full shrink-0 flex-col bg-white border border-[#f0f0f0] text-left group transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl rounded-xl overflow-hidden md:overflow-visible md:p-4">
      <Link href={`/products/${slug || id}`} className="block w-full">
        {/* Full-bleed image on mobile, inset on desktop */}
        <div className="relative aspect-square w-full overflow-hidden bg-white">
          {pack ? (
            <div className="absolute inset-0 flex items-end justify-center">
              <div className="scale-[0.55] origin-bottom md:scale-100">
                <ProductPackShot pack={pack} />
              </div>
            </div>
          ) : (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-contain transition-transform duration-500 md:group-hover:scale-110"
              unoptimized={imageUrl?.startsWith('/uploads/')}
              {...(!imageUrl?.startsWith('/uploads/') && {
                placeholder: "blur",
                blurDataURL: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOGY4Ii8+PC9zdmc+",
              })}
            />
          )}
        </div>
        <div className="px-3 pt-2 md:px-0 md:pt-0">
          <div className="mt-2 md:mt-3 flex flex-wrap items-center gap-1 md:gap-2 w-full">
            <span className="flex text-brand-gold">
              {[...Array(5)].map((_, index) => (
                <Star key={index} size={14} className="md:w-[18px] md:h-[18px]" fill="currentColor" strokeWidth={0} />
              ))}
            </span>
            <span className="text-[12px] md:text-[14px]">{reviews}</span>
          </div>
          <h3 className="mt-1.5 md:mt-3 min-h-[40px] md:min-h-[48px] font-heading text-[15px] md:text-[19px] leading-[1.2] text-black">
            {name}
          </h3>
        </div>
      </Link>
      <div className="px-3 pb-3 md:px-0 md:pb-0">
        <p className="mt-1 min-h-[16px] md:min-h-[20px] text-[11px] md:text-[14px] text-[#555]">{detail}</p>
        <div className="mt-2 md:mt-3 flex flex-wrap min-h-[24px] md:min-h-[30px] items-center gap-2 md:gap-3 text-[14px] md:text-[17px] w-full">
          <span className="font-bold">
            {price?.includes("Tk") || price?.includes("৳") ? price.replace("Tk", "৳") : `৳ ${price}`}
          </span>
          {originalPrice && (
            <span className="text-[#6d6d6d] line-through text-[12px] md:text-[15px] font-bold">
              {originalPrice?.includes("Tk") || originalPrice?.includes("৳") ? originalPrice.replace("Tk", "৳") : `৳ ${originalPrice}`}
            </span>
          )}
          {discount && (
            <span className="bg-[#f6efe4] px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-[12px] uppercase text-brand-gold whitespace-nowrap">
              {discount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={unavailable}
          aria-label={unavailable ? `${name} — unavailable` : `Add ${name} to cart`}
          className={`mt-2.5 md:mt-5 h-[38px] md:h-[42px] w-full text-[12px] md:text-[14px] font-bold uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-green rounded ${
            unavailable
              ? "bg-[#6d8b7b] text-white cursor-not-allowed opacity-70"
              : added
              ? "bg-[#2a6b4a] text-white scale-[0.98]"
              : "bg-brand-green text-white hover:bg-[#00321a] active:scale-[0.97]"
          }`}
        >
          {unavailable ? "Unavailable" : added ? "✓ Added" : "Add To Cart"}
        </button>
      </div>
    </article>
  );
}

function ProductPackShot({ pack }: { pack: NonNullable<ProductCardProps["pack"]> }) {
  if (pack.type === "gift" || pack.type === "sampler") {
    return (
      <div className="relative h-[230px] w-[285px]">
        <div
          className="absolute bottom-0 left-2 h-[170px] w-[235px] rotate-[-7deg] border-[7px] border-white shadow-[0_20px_30px_rgba(0,0,0,0.16)]"
          style={{ backgroundColor: pack.color }}
        >
          <div className="m-4 h-[58px] border border-white/50 bg-white/15" />
          <div className="px-5 text-center font-heading text-[26px] uppercase leading-[1] text-white">
            {pack.title}
          </div>
          <div className="mt-3 text-center text-[12px] font-bold uppercase tracking-[0.15em] text-white/90">
            {pack.subtitle}
          </div>
        </div>
        <div
          className="absolute bottom-6 right-0 h-[128px] w-[170px] rotate-[6deg] border-[6px] border-white shadow-[0_16px_24px_rgba(0,0,0,0.14)]"
          style={{ backgroundColor: pack.accent }}
        >
          <div className="mx-auto mt-5 h-[58px] w-[92px] rounded-full bg-white/80" />
          <div className="mt-3 text-center text-[12px] font-extrabold uppercase tracking-[0.1em] text-white">
            Nahian Fashion
          </div>
        </div>
      </div>
    );
  }

  if (pack.type === "tin") {
    return (
      <div className="relative h-[250px] w-[245px]">
        <div
          className="absolute bottom-0 h-[205px] w-[245px] rounded-t-[34px] shadow-[0_18px_24px_rgba(0,0,0,0.15)]"
          style={{ backgroundColor: pack.color }}
        >
          <div className="h-[36px] rounded-t-[34px] bg-white/18" />
          <div className="mx-auto mt-8 w-[160px] rounded-sm bg-white px-5 py-7 text-center">
            <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-brand-gold">Nahian Fashion</div>
            <div className="mt-4 font-heading text-[28px] leading-[1] text-[#1d1d1d]">{pack.title}</div>
            <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em]">{pack.subtitle}</div>
          </div>
        </div>
      </div>
    );
  }

  const isPouch = pack.type === "pouch";
  const isDailyAssam = pack.title.toLowerCase().includes("daily");
  const isTurmeric = pack.title.toLowerCase().includes("turmeric");

  return (
    <div
      className={`relative ${
        isPouch ? "h-[286px] w-[235px] rounded-t-[4px]" : "h-[232px] w-[270px]"
      }`}
      style={{
        backgroundColor: pack.color,
        boxShadow: "0 12px 18px rgba(0,0,0,.14)",
        clipPath: isPouch
          ? "polygon(0 5%, 100% 5%, 100% 100%, 4% 100%, 0 94%)"
          : "polygon(7% 0, 93% 0, 100% 7%, 100% 100%, 0 100%, 0 7%)",
      }}
    >
      {isPouch && <div className="absolute inset-x-4 top-3 h-[24px] rounded bg-white/10 shadow-inner" />}
      <div
        className={`absolute inset-x-[7px] z-10 ${
          isPouch ? "top-[51px] bottom-[20px]" : "top-[42px] bottom-[23px]"
        } border-[3px] border-brand-gold bg-[#f4ead1] px-5 text-center`}
      >
        <div className="mt-4 text-[25px] font-bold uppercase tracking-[0.05em] text-brand-gold">
          Nahian Fashion
          <sup className="text-[8px]">&reg;</sup>
        </div>
        <div
          className={`mx-auto mt-1 h-[2px] ${isTurmeric ? "bg-[#4e2b18]" : "bg-brand-gold"}`}
          style={{ width: isDailyAssam ? 100 : 122 }}
        />
        <div className="mt-4 font-heading text-[26px] font-bold uppercase leading-[0.9]" style={{ color: pack.accent }}>
          {pack.title}
        </div>
        <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#333]">
          {pack.subtitle}
        </div>
        <div className="mt-5 flex items-center justify-center gap-3">
          <div className="grid h-[66px] w-[66px] place-items-center rounded-full bg-white shadow-inner">
            <div
              className="h-[52px] w-[52px] rounded-full"
              style={{
                background:
                  isTurmeric
                    ? "#d69b25"
                    : isDailyAssam
                      ? "#c94c3a"
                      : "radial-gradient(circle, #7b5135 0 12%, #2f271d 13% 20%, #6b4d2e 21% 36%, #30261d 37% 48%, #8d6a3d 49% 55%, #211b16 56%)",
              }}
            />
          </div>
          <div className="grid h-[86px] w-[86px] place-items-center rounded-full bg-white shadow-inner">
            <div
              className="h-[73px] w-[73px] rounded-full"
              style={{
                background:
                  isTurmeric
                    ? "radial-gradient(circle, #e2a225 0 30%, #b66b19 31% 45%, #f7c54d 46% 60%, #a35b1d 61%)"
                    : "radial-gradient(circle, #38342c 0 20%, #6a5e4d 21% 34%, #2b2a24 35% 46%, #9c8a6e 47% 52%, #343026 53%)",
              }}
            />
          </div>
        </div>
        <div className="mx-auto mt-5 h-[22px] w-[132px] bg-[#222]" />
        <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#444]">
          Net Wt. 7.05 oz (200g)
        </div>
      </div>
      {pack.badge && (
        <div className="absolute right-4 top-[58px] w-[40px] bg-white px-1 py-2 text-center text-[7px] font-black uppercase leading-tight text-[#222]">
          {pack.badge}
        </div>
      )}
      {!isPouch && <div className="absolute left-0 right-0 top-[120px] z-0 h-[45px]" style={{ backgroundColor: pack.accent }} />}
      {!isPouch && (
        <div className="absolute inset-x-0 top-[165px] z-0 bg-[#1c1c1c] py-2 text-center text-[15px] font-black uppercase text-brand-gold">
          {isTurmeric ? "Herbal Tea" : "Green Tea"}
        </div>
      )}
      <div className="absolute bottom-[-10px] left-1/2 h-[18px] w-[210px] -translate-x-1/2 rounded-full bg-black/10 blur-md" />
    </div>
  );
}
