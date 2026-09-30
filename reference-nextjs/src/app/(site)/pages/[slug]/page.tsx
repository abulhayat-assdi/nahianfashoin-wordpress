import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import sanitizeHtml from "sanitize-html";

import { SITE_URL as BASE } from "@/lib/constants";

function toLabel(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const page = await prisma.page.findFirst({
    where: { slug, is_published: true },
  });

  if (!page) {
    const label = toLabel(slug);
    return (
      <main className="min-h-[60vh] bg-white flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl font-heading text-[#1e293b]">{label}</h1>
        <p className="mt-4 text-gray-500">This page is currently empty or hasn&apos;t been published yet.</p>
        <Link href="/" className="mt-8 inline-block bg-[#ac8545] text-white px-10 py-4 rounded-xl font-bold">Back to Home</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-[#ede8df] bg-white px-6 py-3">
        <p className="mx-auto max-w-[1200px] text-[13px] text-[#888]">
          <Link href="/" className="hover:text-[#ac8545]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[#222]">{page.title}</span>
        </p>
      </div>
      <section className="bg-white px-6 py-16 text-center border-b border-[#ede8df]">
        <p className="text-[13px] font-bold uppercase tracking-widest text-[#222]">Nahian Fashion</p>
        <h1 className="mt-3 font-heading text-[36px] md:text-[52px] text-[#ac8545]">{page.title}</h1>
      </section>
      <section className="mx-auto max-w-[1000px] px-6 py-16">
        <div
          className="prose prose-lg max-w-none text-[#333]"
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
      </section>
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
    const page = await prisma.page.findFirst({
      where: { slug, is_published: true },
      select: { title: true, content: true, updated_at: true },
    });
    if (!page) {
      const label = toLabel(slug);
      return { title: `${label} | Nahian Fashion` };
    }

    const rawText = (page.content || "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const description =
      rawText.slice(0, 155) ||
      `${page.title} — Nahian Fashion tea company, Bangladesh.`;

    const title = `${page.title} | Nahian Fashion`;
    const url = `${BASE}/pages/${slug}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
    };
  } catch {
    const label = toLabel(slug);
    return { title: `${label} | Nahian Fashion` };
  }
}
