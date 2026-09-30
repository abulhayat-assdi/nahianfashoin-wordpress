'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import ProductCard from "../ui/ProductCard";
import Image from "next/image";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import Link from 'next/link';



export default function BrandStory({ 
  initialStory, 
  initialTestimonials = [], 
  initialGifts = [] 
}: { 
  initialStory?: any; 
  initialTestimonials?: any[]; 
  initialGifts?: any[];
}) {
  const [story] = useState<any>(initialStory);
  const [celebrityCards] = useState<any[]>(initialTestimonials.filter((t: any) => t.type === 'celebrity'));
  const [reviews] = useState<any[]>(initialTestimonials.filter((t: any) => t.type === 'review'));
  const [giftProducts] = useState<any[]>(() => {
    return initialGifts.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      detail: p.detail,
      price: p.price,
      originalPrice: p.original_price,
      discount: p.discount,
      reviews: p._count?.reviews ? `${p._count.reviews} reviews` : undefined,
      imageUrl: p.media_urls?.[0] || 'https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=900&auto=format&fit=crop',
      unavailable: !p.is_available,
    }));
  });
  return (
    <>
      {celebrityCards.length > 0 && (
        <section className="bg-brand-cream px-6 py-12">
          <div className="mx-auto max-w-[940px] text-center">
            <p className="section-eyebrow">Loved by Celebrities</p>
            <h2 className="section-title mt-4">Trusted by Thousands</h2>
            <div className="mt-9">
              <Swiper
                spaceBetween={16}
                slidesPerView={3.2}
                breakpoints={{
                  768: { slidesPerView: 3, spaceBetween: 48 },
                }}
              >
                {celebrityCards.map((card: any) => (
                  <SwiperSlide key={card.id}>
                    <article className="text-left">
                      <div className="arched relative aspect-square overflow-hidden bg-white">
                        {card.image_url && <Image src={card.image_url} alt={card.name} fill sizes="(max-width: 768px) 33vw, 300px" className="object-cover" unoptimized={card.image_url?.startsWith('/uploads/')} />}
                      </div>
                      <div className="mt-2 flex gap-1 text-brand-gold">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={18} fill="currentColor" strokeWidth={0} />
                        ))}
                      </div>
                      <p className="mt-1.5 text-[14px] md:text-[17px] leading-[1.42]">&quot;{card.quote}&quot;</p>
                      <h3 className="mt-2 md:mt-3 text-[14px] md:text-[18px] font-extrabold uppercase tracking-[0.07em]">
                        {card.name}
                      </h3>
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </section>
      )}

      <section className="bg-brand-cream px-6 py-12">
        <div className="mx-auto max-w-[1200px] border-y border-[#ddd2c1] py-10 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-16">
            
            {/* Content Column */}
            <div className="flex-1 w-full">
              {/* Headers - Centered on mobile, Left on desktop */}
              <div className="text-center md:text-left mb-6 md:mb-8">
                <p className="font-bold uppercase tracking-[0.15em] text-[12px] md:text-[14px] text-black mb-2 md:mb-3">
                  {story?.eyebrow || 'Our Legacy'}
                </p>
                <h2 className="font-heading text-[38px] md:text-[62px] leading-tight text-brand-gold">
                  {story?.title || 'Our Story'}
                </h2>
              </div>
              
              {/* Body Text - Always Left Aligned */}
              <div className="text-left space-y-4 md:space-y-6 text-[14px] md:text-[18px] leading-[1.6] text-[#333] max-w-[620px]">
                <p>{story?.body}</p>
                {story?.body2 && (
                  <p className="text-[#c69c54] font-medium">{story.body2}</p>
                )}
              </div>

              {/* Founder Info Row - ONLY VISIBLE ON MOBILE HERE */}
              <div className="flex md:hidden items-center gap-5 mt-10 text-left">
                {story?.founder_image && (
                  <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-full bg-white shadow-sm border border-black/5">
                    <Image src={story.founder_image} alt={story.founder_name} fill sizes="120px" className="object-cover" unoptimized={story.founder_image?.startsWith('/uploads/')} />
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  {story?.founder_signature && (
                    <img src={story.founder_signature} alt="Signature" className="max-w-[100px] object-contain h-auto mb-2" loading="lazy" decoding="async" />
                  )}
                  <p className="font-heading text-[18px] text-[#222] mb-1">{story?.founder_name}</p>
                  <p className="text-[11px] leading-tight text-[#444] font-medium uppercase tracking-wide">
                    {story?.founder_title}
                  </p>
                </div>
              </div>

              {/* CTA Button - Centered on mobile, Left on desktop */}
              <div className="flex justify-center md:justify-start">
                {story?.cta_text && (
                  <Link href="/blog">
                    <button type="button" className="mt-10 md:mt-12 h-[48px] px-10 bg-[#ac8545] text-[13px] md:text-[14px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#8e6e3b]">
                      {story.cta_text}
                    </button>
                  </Link>
                )}
              </div>
            </div>

            {/* Desktop Founder Column - ONLY VISIBLE ON DESKTOP */}
            <div className="hidden md:flex items-center gap-10 shrink-0">
              {story?.founder_image && (
                <div className="relative h-[340px] w-[340px] shrink-0 overflow-hidden rounded-full bg-white shadow-sm border border-black/5">
                  <Image
                    src={story.founder_image}
                    alt={story.founder_name || "Founder"}
                    fill
                    sizes="340px"
                    className="object-cover"
                    unoptimized={story.founder_image?.startsWith('/uploads/')}
                  />
                </div>
              )}
              
              <div className="flex flex-col justify-center text-left pt-2 min-w-[200px]">
                <div className="relative mb-6 flex items-center">
                  {story?.founder_signature && (
                    <img
                      src={story.founder_signature}
                      alt="Signature"
                      className="max-w-[220px] object-contain h-auto"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <p className="font-heading text-[28px] text-[#222] leading-none mb-2">{story?.founder_name}</p>
                <p className="text-[16px] leading-[1.4] text-[#444] whitespace-pre-line font-medium uppercase tracking-wide">
                  {story?.founder_title}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>


      {reviews.length > 0 && (
        <section className="bg-brand-cream px-6 py-12">
          <div className="mx-auto max-w-[970px] text-center">
            <p className="section-eyebrow">Loved by Everyone</p>
            <h2 className="section-title mt-4">250,000+ Reviews (4.9/5 Stars)</h2>
            <div className="mt-6 md:mt-9">
              <Swiper
                spaceBetween={12}
                slidesPerView={3.3}
                breakpoints={{
                  768: { slidesPerView: 3, spaceBetween: 48 },
                }}
              >
                {reviews.map((review: any) => (
                  <SwiperSlide key={review.id}>
                    <article className="text-left">
                      <div className="relative aspect-[0.56] md:aspect-[0.72] overflow-hidden rounded-[16px] md:rounded-[8px]">
                        {review.image_url && <Image src={review.image_url} alt={review.title} fill sizes="(max-width: 768px) 33vw, 300px" className="object-cover" unoptimized={review.image_url?.startsWith('/uploads/')} />}
                        <span className="absolute left-1/2 top-1/2 grid h-10 w-10 md:h-14 md:w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/50 text-[#ac8545] text-sm md:text-base">
                          &#9654;
                        </span>
                      </div>
                      <h3 className="mt-3 md:mt-6 font-heading text-[12px] md:text-[20px] uppercase leading-snug text-[#ac8545]">
                        {review.title}
                      </h3>
                      <p className="mt-1 text-[12px] md:text-[17px] text-[#333]">{review.author || review.name}</p>
                      <p className="mt-1.5 md:mt-3 text-[12px] md:text-[18px] leading-[1.4] text-[#444]">&quot;{review.quote || review.text}&quot;</p>
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </section>
      )}

      {giftProducts.length > 0 && (
        <section className="bg-white px-6 py-12">
          <div className="mx-auto max-w-[1680px] text-center">
            <h2 className="section-title mt-4 uppercase tracking-[0.08em]">Our Feature Products</h2>
            <div className="relative mt-6 md:mt-9 group max-w-[100vw] overflow-hidden">
              {/* Mobile View: 2x2 Grid (No scroll, 4 items only) */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:hidden">
                {giftProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Desktop View: Swiper Carousel */}
              <div className="hidden md:block relative">
                <div className="swiper-button-prev-gifts absolute left-[20px] top-[180px] z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer">
                  <ChevronLeft className="h-8 w-8 text-black" />
                </div>
                
                <Swiper
                  modules={[Navigation]}
                  navigation={{
                    prevEl: '.swiper-button-prev-gifts',
                    nextEl: '.swiper-button-next-gifts',
                  }}
                  spaceBetween={20}
                  slidesPerView={1.2}
                  breakpoints={{
                    768: { slidesPerView: 2.2, spaceBetween: 24 },
                    1024: { slidesPerView: 3, spaceBetween: 24 },
                    1280: { slidesPerView: 4, spaceBetween: 24 },
                  }}
                  className="!px-14 pb-8"
                >
                  {giftProducts.map((product) => (
                    <SwiperSlide key={product.id}>
                      <ProductCard {...product} />
                    </SwiperSlide>
                  ))}
                </Swiper>

                <div className="swiper-button-next-gifts absolute right-[20px] top-[180px] z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer">
                  <ChevronRight className="h-8 w-8 text-black" />
                </div>
              </div>
            </div>
            <Link href="/collections/all" className="mt-10 inline-block border-b-2 border-black text-[16px] font-extrabold uppercase">
              View All
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
