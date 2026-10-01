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
    reviews: p._count?.reviews ? `${p._count.reviews}` : "0",
    imageUrl: p.media_urls?.[0] || "",
    category: p.category,
    unavailable: !p.is_available,
    isNew: !p.discount && !p.original_price,
  };
}

export default function Bestsellers({ initialProducts = [] }: { initialProducts?: any[] }) {
  const displayed = initialProducts.map(mapProduct);

  return (
    <section className="bg-[#f9f9f9] py-5 md:py-12">
      <div className="mx-auto max-w-[1280px] px-3 md:px-10">

        {/* Header */}
        <div className="mb-3 md:mb-8 text-center">
          <p className="section-eyebrow mb-1">Explore Our Collection</p>
          <h2 className="text-[16px] md:text-[28px] font-bold text-[#1a1a1a]">Featured Products</h2>
        </div>

        {/* Product Grid */}
        {displayed.length === 0 ? (
          <div className="text-center py-16 text-[#999]">কোনো পণ্য পাওয়া যায়নি।</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {displayed.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}

        {/* View all link */}
        <div className="mt-6 md:mt-10 text-center">
          <Link
            href="/collections/all"
            className="inline-flex items-center gap-2 border-2 border-[#1a3c2e] text-[#1a3c2e] px-8 py-3 text-[13px] font-bold uppercase tracking-wider hover:bg-[#1a3c2e] hover:text-white transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
