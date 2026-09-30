import HeroBanner from "@/components/home/HeroBanner";
import Bestsellers from "@/components/home/Bestsellers";
import CategoryGrid from "@/components/home/CategoryGrid";
import { prisma } from "@/lib/db";

export const revalidate = 60;

export default async function Home() {
  let categories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  let products: Awaited<ReturnType<typeof prisma.product.findMany<{ include: { _count: { select: { reviews: true } } } }>>> = [];
  try {
    [categories, products] = await Promise.all([
      prisma.category.findMany({ where: { is_active: true }, orderBy: { display_order: 'asc' } }),
      prisma.product.findMany({ where: { is_available: true }, orderBy: { created_at: 'desc' }, take: 10, include: { _count: { select: { reviews: true } } } }),
    ]);
  } catch {
    // DB unavailable at build time — renders with empty state
  }

  return (
    <>
      <HeroBanner />
      <CategoryGrid initialCategories={categories || []} />
      <Bestsellers initialProducts={products || []} />
    </>
  );
}
