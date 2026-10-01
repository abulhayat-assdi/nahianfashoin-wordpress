"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface Banner {
  image_url: string;
  link?: string;
}

interface HeroText {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  btn_text?: string;
  btn_link?: string;
}

interface HeroSliderProps {
  banners: Banner[];
  heroText?: HeroText;
}

export default function HeroSlider({ banners, heroText = {} }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    intervalRef.current = setInterval(next, 4500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [next, banners.length]);

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (banners.length > 1) {
      intervalRef.current = setInterval(next, 4500);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
      resetTimer();
    }
    touchStartX.current = null;
  };

  if (banners.length === 0) {
    return (
      <Link
        href={heroText.btn_link || "/collections/all"}
        className="block relative w-full aspect-[16/9] md:aspect-auto md:h-[90vh] md:max-h-[800px] bg-[#1a3c2e]"
      >
        <div className="relative z-10 flex h-full items-center px-6 md:px-20">
          <div className="max-w-[520px]">
            {heroText.eyebrow && (
              <p className="text-[10px] md:text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80 mb-2 md:mb-4">
                {heroText.eyebrow}
              </p>
            )}
            {heroText.title && (
              <h1 className="text-[28px] md:text-[62px] font-bold leading-[1.1] text-white mb-2 md:mb-4">
                {heroText.title}
              </h1>
            )}
            {heroText.subtitle && (
              <p className="text-[13px] md:text-[20px] text-white/85 mb-5 md:mb-8 font-light">
                {heroText.subtitle}
              </p>
            )}
            {heroText.btn_text && (
              <span className="inline-flex items-center bg-[#c9a227] text-white px-6 md:px-8 py-2.5 md:py-3.5 text-[11px] md:text-[13px] font-bold uppercase tracking-widest hover:bg-[#b8911f] transition-colors shadow-lg">
                {heroText.btn_text}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      className="relative w-full aspect-[16/9] md:aspect-auto md:h-[90vh] md:max-h-[800px] overflow-hidden bg-[#1a3c2e] select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner Images */}
      {banners.map((banner, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={banner.image_url}
              alt={`Banner ${idx + 1}`}
              fill
              className="object-cover object-center"
              priority={idx === 0}
              sizes="100vw"
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
          </div>
        ))}

      {/* Full-banner click target → current banner's link or All Collections.
          Sits above the images (z-10) but below the text button/arrows/dots so
          those stay independently clickable. */}
      <Link
        href={banners[current]?.link || heroText.btn_link || "/collections/all"}
        className="absolute inset-0 z-10"
        aria-label="View collection"
      />

      {/* Text overlay — container ignores pointer events so the banner link
          underneath stays clickable; only the button re-enables them. */}
      {(heroText.eyebrow || heroText.title || heroText.subtitle || heroText.btn_text) && (
        <div className="relative z-20 flex h-full items-center px-6 md:px-20 pointer-events-none">
          <div className="max-w-[520px]">
            {heroText.eyebrow && (
              <p className="text-[10px] md:text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80 mb-2 md:mb-4">
                {heroText.eyebrow}
              </p>
            )}
            {heroText.title && (
              <h1 className="text-[28px] md:text-[62px] font-bold leading-[1.1] text-white mb-2 md:mb-4">
                {heroText.title}
              </h1>
            )}
            {heroText.subtitle && (
              <p className="text-[13px] md:text-[20px] text-white/85 mb-5 md:mb-8 font-light">
                {heroText.subtitle}
              </p>
            )}
            {heroText.btn_text && (
              <Link
                href={heroText.btn_link || "/collections/all"}
                className="pointer-events-auto inline-flex items-center bg-[#c9a227] text-white px-6 md:px-8 py-2.5 md:py-3.5 text-[11px] md:text-[13px] font-bold uppercase tracking-widest hover:bg-[#b8911f] transition-colors shadow-lg"
              >
                {heroText.btn_text}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Prev / Next arrows — desktop only */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => { prev(); resetTimer(); }}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
            aria-label="Previous banner"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => { next(); resetTimer(); }}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
            aria-label="Next banner"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { goTo(idx); resetTimer(); }}
              className={`rounded-full transition-all duration-300 ${
                idx === current
                  ? "bg-white w-6 h-2.5"
                  : "bg-white/50 w-2.5 h-2.5 hover:bg-white/75"
              }`}
              aria-label={`Go to banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
