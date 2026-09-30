import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Search, Calendar, MessageCircle, ImageIcon } from "lucide-react";

import { SITE_URL as BASE } from "@/lib/constants";

export const revalidate = 300;

function getExcerpt(html: string) {
  if (!html) return "";
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) return titleMatch[1].trim();
  let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<[^>]*>/g, "");
  text = text.replace(/\s+/g, " ").trim();
  return text.substring(0, 130) + (text.length > 130 ? "..." : "");
}

export const metadata: Metadata = {
  title: "Tea Blog — Stories, Brewing Tips & Heritage | Nahian Fashion",
  description:
    "Explore the Nahian Fashion blog — brewing guides, tea heritage stories, and insider tips from our Sylhet tea gardens in Bangladesh.",
  alternates: { canonical: `${BASE}/blog` },
  openGraph: {
    title: "Tea Blog — Stories, Brewing Tips & Heritage | Nahian Fashion",
    description:
      "Explore the Nahian Fashion blog — brewing guides, tea heritage stories, and insider tips from our Sylhet tea gardens in Bangladesh.",
    url: `${BASE}/blog`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tea Blog | Nahian Fashion",
    description:
      "Brewing guides, heritage stories, and insider tips from the Sylhet hills.",
  },
};

export default async function BlogPage() {
  let allBlogs: Awaited<ReturnType<typeof prisma.page.findMany>> = [];
  let settings: { blog_hero_image: string | null } | null = null;
  try {
    [allBlogs, settings] = await Promise.all([
      prisma.page.findMany({
        where: {
          section: { in: ["blog", "Blog"] },
          is_published: true,
          NOT: { slug: "blog" },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.siteSettings.findUnique({
        where: { id: 1 },
        select: { blog_hero_image: true },
      }),
    ]);
  } catch {
    // DB unavailable at build time — renders with empty state
  }

  const headerStyle = settings?.blog_hero_image
    ? {
        backgroundImage: `url(${settings.blog_hero_image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: "white" };

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Nahian Fashion Blog",
    url: `${BASE}/blog`,
    description:
      "Tea heritage stories, brewing guides, and tips from the Sylhet hills of Bangladesh.",
    publisher: {
      "@type": "Organization",
      name: "Nahian Fashion",
      logo: { "@type": "ImageObject", url: `${BASE}/logo.png` },
    },
    blogPost: allBlogs.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${BASE}/blog/${post.slug}`,
      datePublished: post.created_at.toISOString(),
    })),
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <header
        className={`py-20 text-center relative overflow-hidden ${
          settings?.blog_hero_image
            ? "text-white"
            : "bg-white border-b border-gray-100"
        }`}
        style={headerStyle}
      >
        {settings?.blog_hero_image && (
          <div className="absolute inset-0 bg-black/40" />
        )}
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <span
            className={`text-[12px] font-bold uppercase tracking-[0.2em] ${
              settings?.blog_hero_image ? "text-white/80" : "text-gray-400"
            }`}
          >
            Our Blog
          </span>
          <h1
            className={`mt-4 font-heading text-[52px] md:text-[64px] leading-tight ${
              settings?.blog_hero_image
                ? "text-white drop-shadow-lg"
                : "text-[#1e293b]"
            }`}
          >
            Blog
          </h1>
          <p
            className={`mt-6 max-w-[600px] mx-auto text-lg leading-relaxed ${
              settings?.blog_hero_image
                ? "text-white/90 drop-shadow-md"
                : "text-gray-500"
            }`}
          >
            Discover the authentic taste and rich heritage of Bangladesh&apos;s finest
            tea gardens, brewing stories of tradition from the lush hills of
            Sylhet to your cup.
          </p>
        </div>
      </header>

      <div className="max-w-[850px] mx-auto px-6 py-10 md:py-16">
        <div className="mb-10 bg-white p-6 md:p-8 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#ac8545] transition-all text-sm md:text-base"
              aria-label="Search blog articles"
            />
          </div>
        </div>

        <div className="space-y-8 md:space-y-12">
          {allBlogs.map((post) => {
            const imgMatch = post.content?.match(/<img[^>]+src="([^">]+)"/);
            const firstImg = post.header_image || (imgMatch ? imgMatch[1] : null);

            return (
              <Link href={`/blog/${post.slug}`} key={post.slug} className="block group">
                <article className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 h-full">
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="md:w-2/5 relative overflow-hidden bg-gray-50 min-h-[220px]">
                      {firstImg ? (
                        <img
                          src={firstImg}
                          className="w-full h-full absolute inset-0 object-cover group-hover:scale-110 transition-transform duration-700"
                          alt={post.title}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon size={48} className="text-gray-200" />
                        </div>
                      )}
                    </div>
                    <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-center">
                      <span className="inline-block px-3 py-1 rounded-full bg-[#ecfdf5] text-[#10b981] text-[10px] font-bold uppercase tracking-wider mb-3 w-fit">
                        {post.section.toUpperCase()}
                      </span>
                      <h2 className="text-xl md:text-2xl font-heading text-[#1e293b] leading-tight group-hover:text-[#ac8545] transition-colors">
                        {post.title}
                      </h2>
                      <div className="mt-3 text-gray-500 line-clamp-2 text-[14px] md:text-[15px]">
                        {getExcerpt(post.content || "")}
                      </div>
                      <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-6 text-[12px] text-gray-400">
                        <span className="flex items-center gap-2">
                          <Calendar size={14} />
                          <time dateTime={post.created_at.toISOString()}>
                            {new Date(post.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </time>
                        </span>
                        <span className="flex items-center gap-2">
                          <MessageCircle size={14} /> 0 Comments
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
