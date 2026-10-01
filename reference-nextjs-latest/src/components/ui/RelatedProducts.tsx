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

export default function RelatedProducts({
  products,
  category,
}: {
  products: any[];
  category?: string;
}) {
  if (!products || products.length === 0) return null;

  const displayed = products.map(mapProduct);

  return (
    <section className="bg-[#f9f9f9] px-3 md:px-10 py-6 md:py-12 border-t border-[#f0f0f0]">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-3 md:mb-8 text-center">
          {category && <p className="section-eyebrow mb-1">{category}</p>}
          <h2 className="text-[15px] md:text-[24px] font-bold uppercase tracking-wide text-[#1a1a1a]">
            আরও পছন্দ হতে পারে
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {displayed.map(product => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
