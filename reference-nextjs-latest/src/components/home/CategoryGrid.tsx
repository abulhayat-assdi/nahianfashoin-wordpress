"use client";

import Link from "next/link";
import Image from "next/image";

export default function CategoryGrid({ initialCategories = [] }: { initialCategories?: any[] }) {
  if (initialCategories.length === 0) return null;

  return (
    <section className="bg-white py-5 md:py-10">
      <div className="mx-auto max-w-[1280px] px-3 md:px-10">
        {/* Section header */}
        <div className="text-center mb-3 md:mb-6">
          <p className="section-eyebrow mb-1">Explore Our Top Categories</p>
          <h2 className="text-[16px] md:text-[28px] font-bold text-[#1a1a1a]">Shop By Category</h2>
        </div>

        {/* Single-row horizontal scroll on all breakpoints */}
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 md:gap-5 md:justify-center scrollbar-hide">
          {initialCategories.map(cat => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-")}`}
              prefetch={true}
              className="group flex flex-shrink-0 flex-col items-center gap-1.5 w-[92px] md:w-[130px]"
            >
              {/* Image card */}
              <div className="relative w-full h-[110px] md:w-[130px] md:h-[155px] rounded-xl overflow-hidden bg-[#f0ede8] group-hover:shadow-md transition-all duration-300">
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 92px, 130px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized={cat.image_url?.startsWith("/uploads/")}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-[28px] font-bold text-[#1a3c2e]/30">{cat.name[0]}</span>
                  </div>
                )}
              </div>
              <span className="text-[11px] md:text-[14px] font-semibold text-[#1a1a1a] group-hover:text-[#1a3c2e] text-center transition-colors leading-tight px-0.5">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
