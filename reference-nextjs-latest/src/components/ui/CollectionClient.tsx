"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

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

interface FilterPanelProps {
  categories: Category[];
  activeCategories: string[];
  categoriesOpen: boolean;
  onToggleCategoriesOpen: () => void;
  onToggleCategory: (slug: string) => void;
}

function FilterPanel({
  categories,
  activeCategories,
  categoriesOpen,
  onToggleCategoriesOpen,
  onToggleCategory,
}: FilterPanelProps) {
  return (
    <div className="space-y-3">
      <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={onToggleCategoriesOpen}
          className="flex w-full items-center justify-between px-4 py-3.5 bg-white text-[15px] font-semibold text-[#1a1a1a] hover:bg-[#f9f9f9] transition-colors"
        >
          Categories
          <ChevronDown
            size={17}
            className={`transition-transform duration-200 text-[#666] ${categoriesOpen ? "rotate-180" : ""}`}
          />
        </button>
        {categoriesOpen && (
          <div className="px-4 pb-4 pt-2 bg-white border-t border-[#f0f0f0] space-y-3">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center justify-between group"
              >
                <span
                  className={`text-[14px] transition-colors ${
                    activeCategories.includes(cat.slug)
                      ? "text-[#1a3c2e] font-semibold"
                      : "text-[#555] group-hover:text-[#1a1a1a]"
                  }`}
                >
                  {cat.name}
                </span>
                <input
                  type="checkbox"
                  checked={activeCategories.includes(cat.slug)}
                  onChange={() => onToggleCategory(cat.slug)}
                  className="h-[17px] w-[17px] cursor-pointer accent-[#1a3c2e]"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [sortBy, setSortBy] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(true);

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
      : initialProducts.filter((p) => activeCategories.includes(p.category));

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") {
      return parseFloat(a.price.replace(/[^0-9.]/g, "")) - parseFloat(b.price.replace(/[^0-9.]/g, ""));
    }
    if (sortBy === "price-desc") {
      return parseFloat(b.price.replace(/[^0-9.]/g, "")) - parseFloat(a.price.replace(/[^0-9.]/g, ""));
    }
    return 0;
  });

  return (
    <section className="bg-[#f9f9f9] min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-[#eeeeee]">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10 py-3 md:py-10 text-center">
          <h1 className="text-[18px] md:text-[44px] font-bold text-[#1a1a1a] leading-tight">
            {pageTitle}
          </h1>
          <p className="hidden md:block mt-2 text-[14px] md:text-[16px] font-semibold text-[#555]">
            Explore our premium selection of carefully curated products.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 md:px-10 py-3 md:py-8">

        {/* ── Mobile: top bar (filters button + sort) ── */}
        <div className="flex items-center justify-between gap-3 mb-3 md:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#1a3c2e] text-[#1a3c2e] text-[13px] font-bold uppercase tracking-wide rounded-md hover:bg-[#1a3c2e] hover:text-white transition-colors"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeCategories.length > 0 && (
              <span className="bg-[#1a3c2e] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none -mr-1">
                {activeCategories.length}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#888] font-medium">
              {sortedProducts.length} products
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-[38px] pl-3 pr-7 border border-[#ddd] rounded-md text-[13px] font-medium text-[#333] bg-white outline-none focus:border-[#1a3c2e] appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "13px",
              }}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* ── Mobile: Filter Drawer ── */}
        {filtersOpen && (
          <>
            <div
              className="fixed inset-0 z-[200] bg-black/50 md:hidden"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-[210] w-[280px] bg-white shadow-2xl md:hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
                <h2 className="text-[18px] font-bold text-[#1a1a1a]">Filters</h2>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="text-[#666] hover:text-[#222] transition-colors"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterPanel
                categories={categories}
                activeCategories={activeCategories}
                categoriesOpen={categoriesOpen}
                onToggleCategoriesOpen={() => setCategoriesOpen((v) => !v)}
                onToggleCategory={toggleCategory}
              />
              </div>
              <div className="p-4 border-t border-[#f0f0f0]">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="w-full py-3 bg-[#1a3c2e] text-white font-bold text-[14px] rounded-md hover:bg-[#0f2a1e] transition-colors"
                >
                  Show {sortedProducts.length} Products
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Desktop: Sidebar + Main ── */}
        <div className="hidden md:grid md:grid-cols-[240px_1fr] gap-8 items-start">
          {/* Sidebar */}
          <aside>
            <div className="bg-white rounded-lg border border-[#e5e5e5] p-5 sticky top-[80px]">
              <h2 className="text-[15px] font-bold text-[#1a1a1a] mb-4 pb-3 border-b border-[#f0f0f0]">
                Filters
              </h2>
              <FilterPanel
                categories={categories}
                activeCategories={activeCategories}
                categoriesOpen={categoriesOpen}
                onToggleCategoriesOpen={() => setCategoriesOpen((v) => !v)}
                onToggleCategory={toggleCategory}
              />
            </div>
          </aside>

          {/* Main area */}
          <div>
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-5 bg-white border border-[#e5e5e5] rounded-lg px-4 py-3">
              <span className="text-[14px] text-[#666]">
                <span className="font-bold text-[#1a1a1a]">{sortedProducts.length}</span> products found
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#888]">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-[36px] pl-3 pr-8 border border-[#ddd] rounded-md text-[13px] font-medium text-[#333] bg-white outline-none focus:border-[#1a3c2e] appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                    backgroundSize: "13px",
                  }}
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                </select>
              </div>
            </div>

            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {sortedProducts.map((product, i) => (
                  <ProductCard key={product.id} {...product} priority={i < 4} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-white rounded-lg border border-[#e5e5e5]">
                <p className="text-[18px] text-[#999] font-medium">
                  No products found in this category.
                </p>
                <button
                  onClick={() => {
                    setActiveCategories([]);
                    router.push("/collections/all");
                  }}
                  className="mt-5 px-7 py-3 bg-[#1a3c2e] text-white rounded-md text-[14px] font-bold hover:bg-[#0f2a1e] transition-colors"
                >
                  View all products
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile: Product grid ── */}
        <div className="md:hidden">
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {sortedProducts.map((product, i) => (
                <ProductCard key={product.id} {...product} priority={i < 4} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-lg border border-[#e5e5e5]">
              <p className="text-[16px] text-[#999] font-medium">No products found.</p>
              <button
                onClick={() => {
                  setActiveCategories([]);
                  router.push("/collections/all");
                }}
                className="mt-4 px-6 py-2.5 bg-[#1a3c2e] text-white rounded-md text-[14px] font-bold hover:bg-[#0f2a1e] transition-colors"
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
