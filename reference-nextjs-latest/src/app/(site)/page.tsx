import { unstable_cache } from "next/cache";
import HeroBanner from "@/components/home/HeroBanner";
import TrustBadges from "@/components/home/TrustBadges";
import CategoryGrid from "@/components/home/CategoryGrid";
import CategorySections from "@/components/home/CategorySections";
import ComboSection from "@/components/home/ComboSection";
import CustomerReviews from "@/components/home/CustomerReviews";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

const getHomeData = unstable_cache(
  async () => {
    const [categories, allProducts] = await Promise.all([
      prisma.category.findMany({
        where: { is_active: true },
        orderBy: { display_order: "asc" },
      }),
      prisma.product.findMany({
        where: { is_available: true },
        orderBy: [{ display_order: "asc" }, { created_at: "desc" }],
        select: {
          id: true, slug: true, name: true, detail: true, price: true,
          original_price: true, discount: true, media_urls: true,
          category: true, is_available: true,
        },
      }),
    ]);
    return { categories, allProducts };
  },
  ["home-data"],
  { revalidate: 3600, tags: ["products", "categories"] }
);

export default async function Home() {
  let categories: any[] = [];
  let allProducts: any[] = [];
  try {
    const data = await getHomeData();
    categories = data.categories;
    allProducts = data.allProducts;
  } catch {
    // DB unavailable at build time
  }

  return (
    <>
      <HeroBanner />
      <TrustBadges />
      <CategoryGrid initialCategories={categories || []} />
      <CategorySections categories={categories || []} products={allProducts || []} />
      <ComboSection />
      <CustomerReviews />
    </>
  );
}
