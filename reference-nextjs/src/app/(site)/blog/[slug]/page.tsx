import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import sanitizeHtml from "sanitize-html";
import { ArrowRight } from "lucide-react";
import CommentSection from "@/components/blog/CommentSection";
import { SITE_URL } from "@/lib/constants";

function toLabel(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const getBlogPage = cache((slug: string) =>
  prisma.page.findFirst({
    where: { slug, section: "blog", is_published: true },
  })
);

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [page, recentPosts] = await Promise.all([
    getBlogPage(slug),
    prisma.page.findMany({
      where: { section: 'blog', is_published: true, NOT: { slug } },
      select: { title: true, slug: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: 5,
    }),
  ]);

  if (!page) {
    const label = toLabel(slug);
    return (
      <main className="min-h-[60vh] bg-[#f8fafc] flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl font-heading text-[#1e293b]">{label}</h1>
        <p className="mt-4 text-gray-500">This article is currently empty or hasn&apos;t been published yet.</p>
        <Link href="/blog" className="mt-8 inline-block bg-[#ac8545] text-white px-10 py-4 rounded-xl font-bold">Back to Blog</Link>
      </main>
    );
  }

  const headerBgStyle = page.header_image
    ? { backgroundImage: `url(${page.header_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: '#5c4d8c' };

  const rawText = (page.content || "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const excerpt = rawText.slice(0, 155);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: page.title,
    description: excerpt,
    image: page.header_image ? [page.header_image] : [],
    datePublished: page.created_at.toISOString(),
    dateModified: page.updated_at.toISOString(),
    author: { "@type": "Organization", name: "Nahian Fashion", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Nahian Fashion",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${page.slug}` },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: page.title, item: `${SITE_URL}/blog/${page.slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <header className="py-24 text-center relative overflow-hidden" style={headerBgStyle}>
        {!page.header_image && (
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        )}
        {page.header_image && <div className="absolute inset-0 bg-black/50" />}
        <div className="max-w-[900px] mx-auto px-6 relative z-10">
          <h1 className="text-white font-heading text-[52px] md:text-[72px] leading-tight mb-8 drop-shadow-lg">
            {page.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-white/90 text-[15px] font-medium drop-shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-white/40 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                <img src="/logo.png" className="w-full h-full object-contain p-1.5" alt="Nahian Fashion" decoding="async" />
              </div>
              <span>Nahian Fashionm</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-white/60" />
            <span>{new Date(page.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="w-1 h-1 rounded-full bg-white/60" />
            <span>0 Comments</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <article className="lg:col-span-8 bg-white rounded-[40px] p-8 md:p-16 shadow-sm border border-gray-100">
          <div
            className="prose prose-lg max-w-none prose-slate prose-headings:font-heading prose-headings:text-[#1e293b] prose-p:text-gray-600 prose-img:rounded-[24px]"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(page.content || "", {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'figcaption', 'iframe']),
                allowedAttributes: {
                  ...sanitizeHtml.defaults.allowedAttributes,
                  img: ['src', 'alt', 'width', 'height', 'loading'],
                  iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder'],
                  '*': ['class', 'style'],
                },
                allowedSchemes: ['https', 'http', 'mailto'],
              }),
            }}
          />
          <CommentSection slug={page.slug} />
        </article>

        <aside className="lg:col-span-4 space-y-10">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm sticky top-10">
            <h3 className="text-xl font-bold text-[#1e293b] mb-6">Recent Articles</h3>
            <div className="space-y-6">
              {recentPosts.map(post => (
                <Link href={`/blog/${post.slug}`} key={post.slug} className="group block">
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  <h4 className="font-bold text-[#1e293b] group-hover:text-[#ac8545] transition-colors mt-1">
                    {post.title}
                  </h4>
                </Link>
              ))}
            </div>
            <Link href="/blog" className="mt-8 flex items-center gap-2 text-[#ac8545] font-bold text-sm hover:gap-3 transition-all">
              View All Posts <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getBlogPage(slug);
    if (!page) {
      const label = toLabel(slug);
      return { title: `${label} | Nahian Fashion Blog` };
    }

    const rawText = (page.content || "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const description = rawText.slice(0, 155) || `${page.title} — read on the Nahian Fashion tea blog.`;

    const title = `${page.title} | Nahian Fashion Blog`;
    const url = `${SITE_URL}/blog/${slug}`;
    const image = page.header_image || `${SITE_URL}/logo.png`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: "article",
        publishedTime: page.created_at.toISOString(),
        modifiedTime: page.updated_at.toISOString(),
        images: [{ url: image, width: 1200, height: 630, alt: page.title }],
      },
      twitter: { card: "summary_large_image", title, description, images: [image] },
    };
  } catch {
    const label = toLabel(slug);
    return { title: `${label} | Nahian Fashion Blog` };
  }
}
