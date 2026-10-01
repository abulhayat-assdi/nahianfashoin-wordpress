"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";

interface ComboOffer {
  id: string;
  title: string;
  subtitle?: string;
  price: string;
  original_price?: string;
  image_url?: string;
  video_url?: string;
  badge?: string;
  is_active: boolean;
}

export default function ComboSection() {
  const [offers, setOffers] = useState<ComboOffer[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/combo-offers")
      .then(r => r.json())
      .then(json => { setOffers(json.data || []); setLoaded(true); });
  }, []);

  if (loaded && offers.length === 0) return null;

  return (
    <section className="bg-[#1a1a1a] py-12 md:py-16">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#888] mb-2">
            Save More
          </p>
          <h2 className="text-[24px] md:text-[32px] font-bold text-white">Combo Offer</h2>
          <p className="text-[14px] text-[#888] mt-2">Save more with our exclusive combos</p>
        </div>

        {/* Cards */}
        {!loaded ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[280px] bg-white/5 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {offers.map(offer => (
              <div key={offer.id} className="relative bg-[#252525] rounded-lg overflow-hidden group">
                {/* Image / Video thumbnail */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#333]">
                  {offer.image_url ? (
                    <Image
                      src={offer.image_url}
                      alt={offer.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized={offer.image_url?.startsWith("/uploads/")}
                    />
                  ) : (
                    <div className="h-full w-full bg-[#1a3c2e]/30 flex items-center justify-center">
                      <span className="text-white/20 text-5xl font-bold">{offer.title[0]}</span>
                    </div>
                  )}

                  {/* Play button overlay */}
                  {offer.video_url && (
                    <Link href={offer.video_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors">
                        <Play size={20} className="text-[#1a3c2e] ml-1" fill="currentColor" />
                      </div>
                    </Link>
                  )}

                  {/* Badge */}
                  {offer.badge && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm uppercase">
                      {offer.badge}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-[15px] font-bold text-white">{offer.title}</h3>
                  {offer.subtitle && <p className="text-[13px] text-[#888] mt-0.5">{offer.subtitle}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[17px] font-bold text-[#4ade80]">{offer.price}</span>
                      {offer.original_price && (
                        <span className="text-[13px] text-[#666] line-through">{offer.original_price}</span>
                      )}
                    </div>
                    <Link
                      href="/collections/all"
                      className="bg-[#1a3c2e] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#0f2a1e] transition-colors"
                    >
                      SHOP NOW
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
