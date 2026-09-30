import Link from "next/link";
import Ticker from "./Ticker";
import EmailLink from "./EmailLink";
import { prisma } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";

function toSlug(label: string) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

type FooterLink = { label: string };
type FooterColumn = { id: string; heading: string; links: FooterLink[] };
type FooterConfig = { columns: FooterColumn[]; privacy: string; terms: string; social: string };

const DEFAULT_CONFIG: FooterConfig = {
  columns: [],
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  social: 'Show Us Some Love On',
};

function ensureAbsoluteUrl(url: string | null | undefined, fallback: string): string {
  if (!url || !url.trim()) return fallback;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

function buildWhatsAppUrl(value: string | null | undefined): string {
  if (!value || !value.trim()) return '#';
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const digits = trimmed.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '#';
}


export default async function Footer() {
  noStore();
  let config = DEFAULT_CONFIG;
  let tickerItems: string[] = [];
  let settings: any = null;

  try {
    const [settingsData, footerData, homeData] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: 1 } }),
      prisma.footerConfig.findUnique({ where: { id: 1 } }),
      prisma.homeConfig.findUnique({ where: { id: 1 }, select: { ticker_items: true } }),
    ]);

    settings = settingsData;

    if (footerData) {
      config = {
        columns: (footerData.columns as FooterColumn[]) || [],
        privacy: (footerData as any).privacy || DEFAULT_CONFIG.privacy,
        terms: (footerData as any).terms || DEFAULT_CONFIG.terms,
        social: settingsData?.footer_social_heading || (footerData as any).social || DEFAULT_CONFIG.social,
      };
    }

    if (homeData) {
      tickerItems = (homeData.ticker_items as string[]) || [];
    }
  } catch (err) {
    console.error("Footer fetch error:", err);
  }

  return (
    <footer>
      <Ticker tickerItems={tickerItems} />

      <div className="relative w-full overflow-hidden bg-[#f3ead8] h-auto min-h-[380px] md:h-[clamp(380px,38vw,560px)]">
        <div className="absolute inset-0" style={{ backgroundImage: "url('/Footer-image.jpg')", backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center top" }} />

        {config.columns.length > 0 && (
          <div className="relative z-10 mx-auto grid max-w-[1440px] gap-7 md:gap-10 px-6 pt-10 pb-20 md:pb-0 md:grid-cols-4">
            {config.columns.map((col) => {
              const isShopCol = col.heading?.toLowerCase() === 'shop';
              const isAccountCol = col.heading?.toLowerCase() === 'my account';
              return (
                <div key={col.id}>
                  <h3 className="font-heading text-[22px] uppercase text-brand-gold">
                    {col.heading?.toLowerCase() === 'learn' ? 'Blog' : col.heading}
                  </h3>
                  <div className="mt-5 space-y-4">
                    {col.links.filter((l: FooterLink) => l.label).map((link: FooterLink) => {
                      const slug = toSlug(link.label);
                      const isSupportCol = col.heading?.toLowerCase() === 'support' || col.heading?.toLowerCase() === 'customer care' || col.heading?.toLowerCase() === 'help';
                      let href = `/pages/${slug}`;
                      if (isShopCol) {
                        href = `/collections/${slug}`;
                      } else if (isAccountCol) {
                        if (slug === 'account' || slug === 'orders') href = '/account-order';
                        else if (slug === 'addresses' || slug === 'address') href = '/account-address';
                        else href = `/account-${slug}`;
                      } else if (slug === 'blog') {
                        href = '/blog';
                      } else if (slug === 'our-story') {
                        href = '/pages/our-story';
                      }
                      return (
                        <Link key={link.label} href={href} className="block text-[18px] text-black hover:text-[#ac8545] transition-colors">
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="relative md:absolute md:bottom-5 left-0 right-0 z-10 px-6 pb-10 md:pb-0 text-[15px]">
          <div className="mx-auto max-w-[1440px] text-left">
            <Link href="/pages/privacy-policy" className="hover:text-brand-gold transition-colors">{config.privacy}</Link>
            <span className="mx-1 text-gray-400"> | </span>
            <Link href="/pages/terms-and-conditions" className="hover:text-brand-gold transition-colors">{config.terms}</Link>
          </div>
        </div>
      </div>

      <div className="bg-white py-10 text-center">
        <div className="mx-auto mb-8 w-16 border-t border-[#c9a96e]" />
        <p style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic", fontSize: "20px", letterSpacing: "0.04em", color: "#b8962e", marginBottom: "28px" }}>
          {config.social}
        </p>
        <div className="flex items-center justify-center" style={{ gap: "36px", color: "#b8962e" }}>
          <Link href={ensureAbsoluteUrl(settings?.instagram_url, "https://instagram.com")} target="_blank" rel="noopener noreferrer" className="transition-all duration-200 hover:opacity-50 hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" /></svg>
          </Link>
          <Link href={ensureAbsoluteUrl(settings?.facebook_url, "https://facebook.com")} target="_blank" rel="noopener noreferrer" className="transition-all duration-200 hover:opacity-50 hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
          </Link>
          <Link href={buildWhatsAppUrl(settings?.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="transition-all duration-200 hover:opacity-50 hover:scale-110">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" style={{ padding: "1px" }}><path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.065-.301-.149-1.266-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.098-.202.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.36z" /><path d="M20.52 3.449A11.964 11.964 0 0 0 12 0C5.383 0 0 5.383 0 12c0 2.125.553 4.195 1.604 6.01L0 24l6.14-1.604A11.97 11.97 0 0 0 12 24c6.617 0 12-5.383 12-12 0-3.205-1.248-6.22-3.48-8.551zM12 21.986c-1.782 0-3.527-.48-5.05-1.38l-.36-.214-3.75.98 1.002-3.656-.235-.374A9.972 9.972 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z" /></svg>
          </Link>
          <Link href={settings?.phone_number ? `tel:${settings.phone_number}` : '#'} className="transition-all duration-200 hover:opacity-50 hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
          </Link>
          <EmailLink email={settings?.contact_email || "info@nahianfashion.com"}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10" style={{ color: "#b8962e" }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
          </EmailLink>
        </div>
        <div className="mx-auto mt-8 w-16 border-t border-[#c9a96e]" />
      </div>
    </footer>
  );
}
