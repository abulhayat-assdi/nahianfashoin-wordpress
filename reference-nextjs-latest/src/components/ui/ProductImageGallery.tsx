"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const idx = (e as CustomEvent<number>).detail;
      if (typeof idx === "number" && idx >= 0 && idx < images.length) {
        setActiveIndex(idx);
      }
    };
    window.addEventListener("gallery:goto", handler);
    return () => window.removeEventListener("gallery:goto", handler);
  }, [images.length]);

  const nextImage = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square md:aspect-[3/4] w-full bg-[#f5f5f5] flex items-center justify-center text-[#ccc] text-[14px]">
        No image available
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      {/* Thumbnails — vertical left column */}
      {images.length > 1 && (
        <div className="flex flex-col gap-2 w-[68px] md:w-[78px] flex-shrink-0">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-square w-full overflow-hidden border-2 transition-all ${
                activeIndex === i
                  ? "border-[#1a3c2e]"
                  : "border-[#e5e5e5] hover:border-[#aaa]"
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                sizes="78px"
                className="object-cover"
                unoptimized={img?.startsWith("/uploads/")}
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div className="relative flex-1 aspect-square md:aspect-[3/4] bg-[#f5f5f5] overflow-hidden group">
        {/* Wishlist button */}
        <button
          type="button"
          onClick={() => setWishlisted((w) => !w)}
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-sm transition-all"
        >
          <Heart
            size={17}
            className={wishlisted ? "text-red-500" : "text-[#aaa]"}
            fill={wishlisted ? "currentColor" : "none"}
          />
        </button>

        <div
          className="flex h-full w-full transition-transform duration-400 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {images.map((img, i) => (
            <div key={i} className="relative h-full w-full flex-shrink-0">
              <Image
                src={img}
                alt={`${productName} - ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority={i === 0}
                unoptimized={img?.startsWith("/uploads/")}
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prevImage(); }}
              type="button"
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white text-[#1a1a1a] shadow transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); nextImage(); }}
              type="button"
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white text-[#1a1a1a] shadow transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeIndex === i ? "w-5 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
