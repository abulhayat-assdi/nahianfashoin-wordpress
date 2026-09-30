'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from "../ui/ProductCard";
import Link from 'next/link';
import type { ReactNode } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

export default function Bestsellers({ initialProducts = [] }: { initialProducts?: any[] }) {
  const [bestSellers] = useState<any[]>(() => {
    return initialProducts.map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      detail: p.detail,
      price: p.price,
      originalPrice: p.original_price,
      discount: p.discount,
      reviews: p._count?.reviews ? `${p._count.reviews} reviews` : 'No reviews',
      imageUrl: p.media_urls?.[0] || 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=900',
      unavailable: !p.is_available,
    }));
  });

  return (
    <section className="shop-product-section bg-white px-0 py-12">
      <div className="mx-auto text-center">
        <p className="font-body text-[14px] md:text-[18px] font-extrabold uppercase tracking-[0.16em] text-black">
          Discover Your Favorite
        </p>
        <h2 className="mt-2 font-heading text-[32px] md:text-[52px] font-medium leading-none tracking-[0.08em] text-brand-gold">
          Shop by Product
        </h2>

        <div className="relative mt-8 group max-w-[100vw] overflow-hidden">
          {/* Mobile View: 2x2 Grid (No scroll, 4 items only) */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 px-4 md:hidden">
            {bestSellers.length > 0 ? (
              bestSellers.slice(0, 4).map((product) => (
                <ProductCard key={product.id} {...product} />
              ))
            ) : (
              <div className="col-span-2 text-center text-sm py-4">No products found.</div>
            )}
          </div>

          {/* Desktop View: Swiper Carousel */}
          <div className="hidden md:block relative">
            <div className="swiper-button-prev-bestsellers absolute left-[20px] top-[260px] z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer">
              <ChevronLeft className="h-8 w-8 text-black" />
            </div>
            
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: '.swiper-button-prev-bestsellers',
                nextEl: '.swiper-button-next-bestsellers',
              }}
              spaceBetween={20}
              slidesPerView={1.2}
              observer={true}
              observeParents={true}
              breakpoints={{
                768: { slidesPerView: 2.2, spaceBetween: 24 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
                1280: { slidesPerView: 4, spaceBetween: 24 },
              }}
              className="!px-[110px] pb-8"
            >
              {bestSellers.length > 0 ? (
                bestSellers.map((product) => (
                  <SwiperSlide key={product.id}>
                    <ProductCard {...product} />
                  </SwiperSlide>
                ))
              ) : (
                <div className="text-center w-full py-10">No products found.</div>
              )}
            </Swiper>

            <div className="swiper-button-next-bestsellers absolute right-[20px] top-[260px] z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer">
              <ChevronRight className="h-8 w-8 text-black" />
            </div>
          </div>
        </div>
        <LinkLike href="/collections/all">See More</LinkLike>
      </div>
    </section>
  );
}

function LinkLike({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-10 inline-block border-b-2 border-black text-[16px] font-extrabold uppercase tracking-[0.02em]"
    >
      {children}
    </Link>
  );
}
