"use client";

import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";

function mapProduct(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    detail: p.detail || "",
    price: p.price,
    originalPrice: p.original_price || "",
    discount: p.discount || "",
    reviews: "0",
    imageUrl: Array.isArray(p.media_urls) ? (p.media_urls[0] || "") : "",
    category: p.category,
    unavailable: !p.is_available,
    isNew: !p.discount && !p.original_price,
  };
}

interface Props {
  categories: any[];
  products: any[];
}

export default function CategorySections({ categories, products }: Props) {
  if (!categories.length || !products.length) return null;

  // Group products by category name — case-insensitive, whitespace-trimmed
  const productsByCategory: Record<string, any[]> = {};
  for (const p of products) {
    const key = (p.category || "").toLowerCase().trim();
    if (!productsByCategory[key]) productsByCategory[key] = [];
    productsByCategory[key].push(p);
  }

  // Respect display_order from admin. Skip categories with no products.
  const sections = categories
    .map(cat => {
      const key = (cat.name || "").toLowerCase().trim();
      const catProducts = productsByCategory[key] || [];
      return { cat, products: catProducts.slice(0, 4) };
    })
    .filter(s => s.products.length > 0);

  if (!sections.length) return null;

  return (
    <>
      {sections.map(({ cat, products: catProducts }, idx) => {
        const collectionSlug =
          cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-");
        const displayed = catProducts.map(mapProduct);
        const bg = idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]";

        return (
          <section
            key={cat.id}
            className={`${bg} py-6 md:py-12 border-t border-[#f0f0f0]`}
          >
            <div className="mx-auto max-w-[1280px] px-3 md:px-10">

              {/* ── Heading + See All — left-aligned, same row ─────── */}
              <div className="flex items-center justify-between mb-4 md:mb-7">
                <h2 className="text-[16px] md:text-[24px] font-bold text-[#1a1a1a] leading-tight">
                  Shop {cat.name} Collection
                </h2>
                <Link
                  href={`/collections/${collectionSlug}`}
                  className="shrink-0 ml-3 text-[11px] md:text-[13px] font-semibold text-[#1a3c2e] border border-[#1a3c2e] px-3 py-1.5 hover:bg-[#1a3c2e] hover:text-white transition-colors"
                >
                  See All
                </Link>
              </div>

              {/* Mobile: 2 cols · Desktop: 4 cols */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {displayed.map((product, pi) => (
                  <ProductCard key={product.id} {...product} priority={idx === 0 && pi < 2} />
                ))}
              </div>

              {/* See All Products — centered */}
              <div className="mt-4 md:mt-7 flex justify-center">
                <Link
                  href={`/collections/${collectionSlug}`}
                  className="inline-flex items-center gap-2 bg-[#1a3c2e] text-white px-6 py-2.5 text-[12px] md:text-[13px] font-bold uppercase tracking-wider hover:bg-[#0f2a1e] transition-colors"
                >
                  See All Products
                </Link>
              </div>

            </div>
          </section>
        );
      })}
    </>
  );
}
