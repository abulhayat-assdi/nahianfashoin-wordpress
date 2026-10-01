"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  isNew?: boolean;
  priority?: boolean;
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
  isNew,
  priority = false,
}: ProductCardProps) {
  const router = useRouter();

  const reviewCount = parseInt(reviews) || 0;
  const displayPrice = price?.includes("৳")
    ? price
    : price?.includes("Tk")
    ? price.replace("Tk", "৳")
    : `৳${price}`;
  const displayOriginal = originalPrice
    ? originalPrice?.includes("৳")
      ? originalPrice
      : originalPrice?.includes("Tk")
      ? originalPrice.replace("Tk", "৳")
      : `৳${originalPrice}`
    : null;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = existing.findIndex((i: any) => i.id === id);
    if (idx > -1) {
      existing[idx] = { ...existing[idx], quantity: (existing[idx].quantity || 1) + 1 };
    } else {
      existing.push({ id, name, price, image: imageUrl, detail, originalPrice, discount, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(existing));

    // Dispatch a bare cart:add (no detail) so the Header refreshes its cart
    // count from localStorage WITHOUT opening the cart drawer. We go straight
    // to checkout instead.
    window.dispatchEvent(new CustomEvent("cart:add"));

    const numericPrice = parsePrice(price);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "add_to_cart",
      event_id: crypto.randomUUID(),
      ecommerce: {
        currency: "BDT",
        value: numericPrice,
        items: [
          {
            item_id: id,
            item_name: name,
            item_brand: "Nahian Fashion",
            item_category: category || "Fashion",
            price: numericPrice,
            quantity: 1,
          },
        ],
      },
    });

    router.push("/checkout");
  }

  return (
    <article className="relative flex flex-col bg-white border border-[#ebebeb] rounded-lg overflow-hidden group hover:shadow-md transition-shadow duration-300">
      {/* Image area */}
      <Link href={`/products/${slug || id}`} className="block relative">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f5f5f5]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={imageUrl?.startsWith("/uploads/")}
              priority={priority}
              quality={80}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-[#f0f0f0]">
              <span className="text-[#ccc] text-4xl font-bold">{name[0]}</span>
            </div>
          )}

          {/* Discount badge — top right, green */}
          {discount && (
            <span className="absolute top-2.5 right-2.5 bg-[#16a34a] text-white text-[10px] font-bold px-2 py-1 rounded-sm leading-none z-10">
              {discount.toLowerCase().startsWith("save") || discount.includes("%")
                ? discount
                : `Save ${discount}`}
            </span>
          )}

          {/* NEW badge — top left, only when no discount */}
          {isNew && !discount && (
            <span className="absolute top-2.5 left-2.5 bg-[#1a3c2e] text-white text-[10px] font-bold px-2 py-1 rounded-sm leading-none uppercase z-10">
              New
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 md:p-4">
        <Link href={`/products/${slug || id}`}>
          <h3 className="text-[13px] md:text-[14px] font-semibold text-[#1a1a1a] leading-snug hover:text-[#1a3c2e] transition-colors line-clamp-2 mb-2">
            {name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex flex-col gap-0.5 mb-3">
          {displayOriginal && (
            <span className="text-[11px] md:text-[12px] text-[#888] line-through">
              {displayOriginal}
            </span>
          )}
          <span className="text-[15px] md:text-[16px] font-bold text-[#1a3c2e]">
            {displayPrice}
          </span>
        </div>

        {/* Star rating — only when reviews exist */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                viewBox="0 0 24 24"
                className="w-3 h-3 text-amber-400 fill-amber-400"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
            <span className="text-[11px] text-[#888] ml-1">({reviewCount})</span>
          </div>
        )}

        {/* Order button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={unavailable}
          className={`mt-auto w-full flex items-center justify-center py-2.5 text-[13px] md:text-[14px] font-bold border-2 rounded-sm transition-all duration-200 ${
            unavailable
              ? "border-[#ccc] text-[#ccc] cursor-not-allowed"
              : "border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e] hover:text-white active:scale-[0.98]"
          }`}
        >
          {unavailable ? "Unavailable" : "অর্ডার করুন"}
        </button>
      </div>
    </article>
  );
}
