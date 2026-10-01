import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import sanitizeHtml from "sanitize-html";

import { SITE_URL as BASE } from "@/lib/constants";

function toLabel(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function ContactPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  const contacts = [
    settings?.facebook_url && {
      label: "Facebook",
      href: settings.facebook_url,
      bg: "#1877F2",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
      ),
    },
    settings?.instagram_url && {
      label: "Instagram",
      href: settings.instagram_url,
      bg: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      ),
    },
    settings?.whatsapp_number && {
      label: "WhatsApp",
      href: settings.whatsapp_number.startsWith('http') ? settings.whatsapp_number : `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`,
      bg: "#25D366",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    settings?.phone_number && {
      label: "Call Us",
      href: `tel:${settings.phone_number}`,
      bg: "#ac8545",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
      ),
    },
    settings?.contact_email && {
      label: "Email",
      href: `mailto:${settings.contact_email}`,
      bg: "#EA4335",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ),
    },
  ].filter(Boolean) as { label: string; href: string; bg: string; icon: ReactNode }[];

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-[#ede8df] bg-white px-6 py-3">
        <p className="mx-auto max-w-[1200px] text-[13px] text-[#888]">
          <Link href="/" className="hover:text-[#ac8545]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[#222]">Contact</span>
        </p>
      </div>
      <section className="bg-white px-6 py-16 text-center border-b border-[#ede8df]">
        <p className="text-[13px] font-bold uppercase tracking-widest text-[#222]">Nahian Fashion</p>
        <h1 className="mt-3 font-heading text-[36px] md:text-[52px] text-[#ac8545]">Contact Us</h1>
        <p className="mt-4 text-gray-500 max-w-md mx-auto">আমাদের সাথে যোগাযোগ করুন। আমরা সবসময় আপনার সেবায় প্রস্তুত।</p>
      </section>

      <section className="mx-auto max-w-[900px] px-6 py-16">
        {contacts.length === 0 ? (
          <p className="text-center text-gray-400">Contact information not configured yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="group flex flex-col items-center justify-center gap-4 rounded-2xl p-8 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                style={{ background: c.bg }}
              >
                <span className="opacity-90 group-hover:opacity-100 transition-opacity">{c.icon}</span>
                <span className="text-lg font-semibold tracking-wide">{c.label}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === 'contact') {
    return <ContactPage />;
  }

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
      `${page.title} — Nahian Fashion, Bangladesh.`;

    const title = `${page.title} | Nahian Fashion`;
    const url = `${BASE}/pages/${slug}`;

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
  } catch {
    const label = toLabel(slug);
    return { title: `${label} | Nahian Fashion` };
  }
}
