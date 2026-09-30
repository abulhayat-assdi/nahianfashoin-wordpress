'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function CategoryGrid({ initialCategories = [] }: { initialCategories?: any[] }) {
  const [categories] = useState<any[]>(initialCategories);

  if (categories.length === 0) return null;

  return (
    <section className="bg-brand-cream px-6 py-12 md:px-[118px]">
      <div className="mx-auto max-w-[1230px] text-center">
        <p className="section-eyebrow">Something For Everyone</p>
        <h2 className="section-title mt-4">Shop by Category</h2>
        <div className="mt-8">
          <Swiper
            spaceBetween={20}
            slidesPerView={3.2}
            observer={true}
            observeParents={true}
            breakpoints={{
              768: { slidesPerView: 2, spaceBetween: 32 },
              1024: { slidesPerView: 4, spaceBetween: 40 },
            }}
          >
            {categories.map((category) => (
              <SwiperSlide key={category.id}>
                <Link href={`/collections/${category.slug}`} className="group block text-center">
                  <div className="arched relative mx-auto aspect-[0.84] w-full max-w-[370px] overflow-hidden bg-brand-green">
                    {category.image_url && (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 370px"
                        className="object-cover transition duration-700 group-hover:scale-105"
                        unoptimized={category.image_url?.startsWith('/uploads/')}
                      />
                    )}
                  </div>
                  <h3 className="mt-4 text-[12px] md:text-[18px] font-bold uppercase tracking-[0.12em] text-black">
                    {category.name}
                  </h3>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
