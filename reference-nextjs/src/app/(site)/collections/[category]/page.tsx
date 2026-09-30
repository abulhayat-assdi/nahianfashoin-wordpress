import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import CollectionClient from "@/components/ui/CollectionClient";

import { SITE_URL as BASE } from "@/lib/constants";

export const revalidate = 60;

type PageProps = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const activeCategories =
    rawCategory === "all"
      ? []
      : rawCategory.split("%2B").flatMap((c) => c.split("+"));

  let pageTitle = "All Collections";
  if (activeCategories.length > 0) {
    try {
      const cats = await prisma.category.findMany({
        where: { slug: { in: activeCategories } },
        select: { name: true },
      });
      if (cats.length > 0) {
        pageTitle = cats.map((c) => c.name).join(" & ");
      }
    } catch {}
  }

  const title = `${pageTitle} | Nahian Fashion`;
  const description = `Shop ${pageTitle} — premium single-estate teas from the Sylhet hills of Bangladesh. Free shipping available.`;
  const url = `${BASE}/collections/${rawCategory}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { category: rawCategory } = await params;

  const activeCategories =
    rawCategory === "all"
      ? []
      : rawCategory.split("%2B").flatMap((c) => c.split("+"));

  const [categoriesData, productsData] = await Promise.all([
    prisma.category.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
    }),
    prisma.product.findMany({
      where: { is_available: true },
      orderBy: { created_at: "desc" },
      include: { _count: { select: { reviews: true } } },
    }),
  ]);

  const categories = categoriesData.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
  }));

  const products = productsData.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    detail: p.detail || "",
    price: p.price,
    originalPrice: p.original_price || undefined,
    discount: p.discount || undefined,
    reviews: p._count.reviews > 0 ? `${p._count.reviews} reviews` : "No reviews",
    imageUrl:
      Array.isArray(p.media_urls) && (p.media_urls as string[]).length > 0
        ? (p.media_urls as string[])[0]
        : "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=900",
    category: p.category ? p.category.toLowerCase().replace(/ /g, "-") : "",
    unavailable: !p.is_available,
  }));

  const pageTitle =
    activeCategories.length === 0
      ? "All Collections"
      : activeCategories
          .map((slug) => {
            const found = categories.find((c) => c.slug === slug);
            return found ? found.name : slug;
          })
          .join(" & ");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      {
        "@type": "ListItem",
        position: 2,
        name: pageTitle,
        item: `${BASE}/collections/${rawCategory}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CollectionClient
        initialProducts={products}
        categories={categories}
        activeCategories={activeCategories}
        pageTitle={pageTitle}
      />
    </>
  );
}
