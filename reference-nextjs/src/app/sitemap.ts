import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { SITE_URL as BASE } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/collections/all`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  try {
    const [products, categories, pages] = await Promise.all([
      prisma.product.findMany({
        where: { is_available: true },
        select: { slug: true, created_at: true },
      }),
      prisma.category.findMany({
        where: { is_active: true, slug: { not: null } },
        select: { slug: true },
      }),
      prisma.page.findMany({
        where: { is_published: true },
        select: { slug: true, section: true, updated_at: true },
      }),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE}/products/${p.slug}`,
        lastModified: p.created_at,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      }));

    const categoryRoutes: MetadataRoute.Sitemap = categories
      .filter((c) => c.slug)
      .map((c) => ({
        url: `${BASE}/collections/${c.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }));

    const blogRoutes: MetadataRoute.Sitemap = pages
      .filter((p) => p.section === 'blog' || p.section === 'Blog')
      .map((p) => ({
        url: `${BASE}/blog/${p.slug}`,
        lastModified: p.updated_at,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));

    const staticPageRoutes: MetadataRoute.Sitemap = pages
      .filter((p) => p.section !== 'blog' && p.section !== 'Blog')
      .map((p) => ({
        url: `${BASE}/pages/${p.slug}`,
        lastModified: p.updated_at,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }));

    return [
      ...staticRoutes,
      ...productRoutes,
      ...categoryRoutes,
      ...blogRoutes,
      ...staticPageRoutes,
    ];
  } catch {
    return staticRoutes;
  }
}
