import Link from "next/link";
import EmailLink from "./EmailLink";
import { prisma } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type FooterLink = { label: string };
type FooterColumn = { id: string; heading: string; links: FooterLink[] };
type FooterConfig = { columns: FooterColumn[]; privacy: string; terms: string };

const DEFAULT_CONFIG: FooterConfig = {
  columns: [],
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
};

function ensureAbsoluteUrl(url: string | null | undefined, fallback: string): string {
  if (!url || !url.trim()) return fallback;
  const t = url.trim();
  return t.startsWith("http://") || t.startsWith("https://") ? t : `https://${t}`;
}

export default async function Footer() {
  noStore();
  let config = DEFAULT_CONFIG;
  let settings: any = null;
  let shopCategories: { name: string; slug: string }[] = [];
  let supportPages: { title: string; slug: string }[] = [];

  // Settings and footer config — critical, load first
  try {
    const [settingsData, footerData] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: 1 } }),
      prisma.footerConfig.findUnique({ where: { id: 1 } }),
    ]);
    settings = settingsData;
    if (footerData) {
      config = {
        columns: (footerData.columns as FooterColumn[]) || [],
        privacy: (footerData as any).privacy || DEFAULT_CONFIG.privacy,
        terms: (footerData as any).terms || DEFAULT_CONFIG.terms,
      };
    }
  } catch (err) {
    console.error("Footer settings fetch error:", err);
  }

  // Categories and pages — isolated so a missing column doesn't break the rest
  try {
    const [categoriesData, pagesData] = await Promise.all([
      prisma.category.findMany({
        where: { is_active: true },
        orderBy: { display_order: "asc" },
        select: { name: true, slug: true },
      }),
      prisma.page.findMany({
        where: { section: "support", is_published: true },
        orderBy: { created_at: "asc" },
        select: { title: true, slug: true },
      }),
    ]);
    shopCategories = categoriesData.map(c => ({ name: c.name, slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-") }));
    supportPages = pagesData;
  } catch (err) {
    console.error("Footer categories/pages fetch error:", err);
  }

  // Non-shop, non-support, non-blog columns from footer config
  const otherColumns = config.columns.filter(col => {
    const h = col.heading?.toLowerCase();
    return h !== "shop" && h !== "support" && h !== "blog" && h !== "learn";
  });

  return (
    <footer className="bg-[#1a1a1a] text-white">
      {/* Main footer grid */}
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">

          {/* Brand column */}
          <div>
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Nahian Fashion" className="h-10 w-auto" />
            </div>
            <p className="text-[13px] text-gray-400 leading-relaxed max-w-[240px]">
              {settings?.site_tagline || "Premium quality panjabi and fashion for the modern man."}
            </p>
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              {settings?.facebook_url && (
                <Link href={ensureAbsoluteUrl(settings.facebook_url, "#")} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#1a3c2e] transition-colors" title="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                </Link>
              )}
              {settings?.instagram_url && (
                <Link href={ensureAbsoluteUrl(settings.instagram_url, "#")} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#1a3c2e] transition-colors" title="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" /></svg>
                </Link>
              )}
              {settings?.whatsapp_number && (
                <Link href={buildWhatsAppUrl(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#1a3c2e] transition-colors" title="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.065-.301-.149-1.266-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.098-.202.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.36z" /><path d="M20.52 3.449A11.964 11.964 0 0 0 12 0C5.383 0 0 5.383 0 12c0 2.125.553 4.195 1.604 6.01L0 24l6.14-1.604A11.97 11.97 0 0 0 12 24c6.617 0 12-5.383 12-12 0-3.205-1.248-6.22-3.48-8.551zM12 21.986c-1.782 0-3.527-.48-5.05-1.38l-.36-.214-3.75.98 1.002-3.656-.235-.374A9.972 9.972 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z" /></svg>
                </Link>
              )}
              {settings?.phone_number && (
                <Link href={`tel:${settings.phone_number}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#1a3c2e] transition-colors" title="Call">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </Link>
              )}
              {settings?.contact_email && (
                <EmailLink email={settings.contact_email}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-[#1a3c2e] transition-colors cursor-pointer" title="Email">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  </span>
                </EmailLink>
              )}
            </div>
          </div>

          {/* Other admin-managed columns (Blog, My Account, etc.) */}
          {otherColumns.slice(0, 1).map(col => {
            const isAccountCol = col.heading?.toLowerCase() === "my account";
            return (
              <div key={col.id}>
                <h3 className="text-[13px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
                  {col.heading}
                </h3>
                <div className="space-y-3">
                  {col.links.filter((l: FooterLink) => l.label).map((link: FooterLink) => {
                    const slug = link.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    let href = `/pages/${slug}`;
                    if (isAccountCol) {
                      if (slug === "account" || slug === "orders") href = "/account-order";
                      else if (slug === "addresses" || slug === "address") href = "/account-address";
                      else href = `/account-${slug}`;
                    } else if (slug === "home") href = "/";
                    return (
                      <Link key={link.label} href={href} className="block text-[14px] text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Shop column — dynamic from categories with show_in_footer */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Shop</h3>
            <div className="space-y-3">
              {shopCategories.length === 0 ? (
                <p className="text-[13px] text-gray-600 italic">No categories added yet.</p>
              ) : shopCategories.map(cat => (
                <Link key={cat.slug} href={`/collections/${cat.slug}`} className="block text-[14px] text-gray-400 hover:text-white transition-colors">
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Support column — dynamic from published support pages with show_in_footer */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Support</h3>
            <div className="space-y-3">
              {supportPages.length === 0 ? (
                <p className="text-[13px] text-gray-600 italic">No support pages added yet.</p>
              ) : supportPages.map(page => (
                <Link key={page.slug} href={`/pages/${page.slug}`} className="block text-[14px] text-gray-400 hover:text-white transition-colors">
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-gray-500">
            © {new Date().getFullYear()} Nahian Fashion. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href={`/pages/${config.privacy.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}`} className="text-[12px] text-gray-500 hover:text-white transition-colors">{config.privacy}</Link>
            <span className="text-gray-700">|</span>
            <Link href={`/pages/${config.terms.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}`} className="text-[12px] text-gray-500 hover:text-white transition-colors">{config.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
