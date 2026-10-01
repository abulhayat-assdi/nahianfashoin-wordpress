import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import CollectionClient from "@/components/ui/CollectionClient";
import { SITE_URL as BASE } from "@/lib/constants";

// Re-render at most once per hour; revalidatePath overrides immediately
export const revalidate = 3600;
export const dynamicParams = true;

type PageProps = { params: Promise<{ category: string }> };

const fetchCollectionData = unstable_cache(
  async () => {
  const [categoriesData, productsData] = await Promise.all([
    prisma.category.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.product.findMany({
      where: { is_available: true },
      orderBy: [{ display_order: "asc" }, { created_at: "desc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        detail: true,
        price: true,
        original_price: true,
        discount: true,
        media_urls: true,
        category: true,
        is_available: true,
      },
    }),
  ]);
    return { categoriesData, productsData };
  },
  ["collection-data"],
  { revalidate: 3600, tags: ["products", "categories"] }
);

export async function generateStaticParams() {
  try {
    const cats = await prisma.category.findMany({
      where: { is_active: true },
      select: { slug: true, name: true },
    });
    const catParams = cats.map((c) => ({
      category: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
    }));
    return [{ category: "all" }, ...catParams];
  } catch {
    return [{ category: "all" }];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const activeSlugs =
    rawCategory === "all"
      ? []
      : rawCategory.split("%2B").flatMap((c) => c.split("+"));

  let pageTitle = "All Collections";
  if (activeSlugs.length > 0) {
    try {
      const { categoriesData } = await fetchCollectionData();
      const categories = categoriesData.map((c) => ({
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
      }));
      const matched = categories.filter((c) => activeSlugs.includes(c.slug));
      if (matched.length > 0) pageTitle = matched.map((c) => c.name).join(" & ");
    } catch {}
  }

  const title = `${pageTitle} | Nahian Fashion`;
  const description = `Shop ${pageTitle} — premium quality fashion and panjabi from Nahian Fashion, Bangladesh.`;
  const url = `${BASE}/collections/${rawCategory}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: `${BASE}/logo.png`, width: 800, height: 600, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${BASE}/logo.png`] },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { category: rawCategory } = await params;

  const activeCategories =
    rawCategory === "all"
      ? []
      : rawCategory.split("%2B").flatMap((c) => c.split("+"));

  let categoriesData: { id: string; name: string; slug: string | null }[] = [];
  let productsData: {
    id: string; slug: string; name: string; detail: string | null;
    price: string; original_price: string | null; discount: string | null;
    media_urls: unknown; category: string; is_available: boolean;
  }[] = [];

  try {
    const data = await fetchCollectionData();
    categoriesData = data.categoriesData;
    productsData = data.productsData;
  } catch {
    // DB unavailable at build time — render with empty state
  }

  const categories = categoriesData.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
  }));

  // Map normalised category name → authoritative slug from DB
  // This ensures product.category ("Print Panjabi") correctly resolves to
  // the same slug used in the URL ("print-panjabi"), even if the category
  // was renamed or has irregular spacing.
  const nameToSlug: Record<string, string> = {};
  for (const c of categories) {
    nameToSlug[c.name.toLowerCase().trim()] = c.slug;
  }

  const products = productsData.map((p) => {
    const normName = (p.category || "").toLowerCase().trim();
    const categorySlug = nameToSlug[normName] ?? normName.replace(/\s+/g, "-");
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      detail: p.detail || "",
      price: p.price,
      originalPrice: p.original_price || undefined,
      discount: p.discount || undefined,
      reviews: "",
      imageUrl:
        Array.isArray(p.media_urls) && (p.media_urls as string[]).length > 0
          ? (p.media_urls as string[])[0]
          : "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=900",
      category: categorySlug,
      unavailable: !p.is_available,
    };
  });

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
