"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import { ChevronDown } from "lucide-react";

type Category = { id: string; name: string; slug: string };

type Product = {
  id: string;
  slug: string;
  name: string;
  detail: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  reviews: string;
  imageUrl: string;
  category: string;
  unavailable: boolean;
};

interface CollectionClientProps {
  initialProducts: Product[];
  categories: Category[];
  activeCategories: string[];
  pageTitle: string;
}

export default function CollectionClient({
  initialProducts,
  categories,
  activeCategories: initialActive,
  pageTitle,
}: CollectionClientProps) {
  const router = useRouter();
  const [activeCategories, setActiveCategories] = useState(initialActive);

  const toggleCategory = (slug: string) => {
    let newCats = [...activeCategories];
    if (newCats.includes(slug)) {
      newCats = newCats.filter((c) => c !== slug);
    } else {
      newCats.push(slug);
    }
    if (newCats.length === 0) {
      router.push("/collections/all");
    } else {
      router.push(`/collections/${newCats.join("+")}`);
    }
    setActiveCategories(newCats);
  };

  const filteredProducts =
    activeCategories.length === 0
      ? initialProducts
      : initialProducts.filter((t) => activeCategories.includes(t.category));

  return (
    <section className="bg-white px-6 py-8 md:px-[116px]">
      <div className="text-center">
        <h1 className="font-heading text-[46px] text-brand-gold">{pageTitle}</h1>
        <p className="mt-2 text-[20px] font-extrabold text-[#444]">
          Explore our premium selection of carefully curated teas.
        </p>
      </div>
      <div className="mt-10 grid gap-12 md:grid-cols-[280px_1fr]">
        <aside className="border-r border-[#d8c9ad] pr-10" aria-label="Product filters">
          <h2 className="font-heading text-[24px] text-brand-gold mb-6">Filters</h2>
          <div className="border-t border-[#e3d8c7] py-7">
            <button
              className="flex w-full items-center justify-between font-heading text-[23px]"
              type="button"
              aria-expanded="true"
            >
              Categories
              <ChevronDown className="rotate-180" size={18} />
            </button>
            <div className="mt-7 space-y-4">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex cursor-pointer items-center justify-between text-[17px] text-[#444] hover:text-black"
                >
                  {cat.name}
                  <input
                    type="checkbox"
                    checked={activeCategories.includes(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                    className="h-[18px] w-[18px] cursor-pointer accent-brand-gold"
                  />
                </label>
              ))}
            </div>
          </div>
        </aside>
        <div>
          <div className="mb-8 flex justify-between items-center text-[#666]">
            <span className="text-[15px] font-medium">
              {filteredProducts.length} products found
            </span>
            <button className="flex items-center gap-2 text-[17px]" type="button">
              <span className="font-heading text-[23px] text-brand-gold">Sort By:</span> Featured
              <ChevronDown size={16} />
            </button>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-[1200px]">
              {filteredProducts.map((tea) => (
                <ProductCard key={tea.id} {...tea} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-[#666]">
              <p className="text-[18px]">No products found in this category.</p>
              <button
                onClick={() => {
                  setActiveCategories([]);
                  router.push("/collections/all");
                }}
                className="mt-4 text-brand-green font-bold underline"
              >
                View all products
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
