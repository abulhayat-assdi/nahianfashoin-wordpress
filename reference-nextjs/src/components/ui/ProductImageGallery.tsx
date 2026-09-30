"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextImage = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      nextImage();
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length, nextImage, activeIndex]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full bg-[#f8f8f8] flex items-center justify-center text-gray-300">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div className="relative aspect-square w-full bg-[#f8f8f8] overflow-hidden group">
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {images.map((img, i) => (
            <div key={i} className="relative h-full w-full flex-shrink-0">
              <Image
                src={img}
                alt={`${productName} - View ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority={i === 0}
                unoptimized={img?.startsWith('/uploads/')}
              />
            </div>
          ))}
        </div>

        {/* Arrow Controls - only if more than 1 image */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prevImage(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[#ac8545] p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              type="button"
              aria-label="Previous image"
            >
              <ChevronLeft size={32} strokeWidth={1.5} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); nextImage(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ac8545] p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              type="button"
              aria-label="Next image"
            >
              <ChevronRight size={32} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-[70px] w-[70px] md:h-[90px] md:w-[90px] shrink-0 border-b-2 bg-[#f8f8f8] transition-all duration-300 overflow-hidden ${activeIndex === i ? "border-[#222] opacity-100 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                }`}
            >
              <Image src={img} alt="" fill sizes="90px" className="object-cover" unoptimized={img?.startsWith('/uploads/')} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
