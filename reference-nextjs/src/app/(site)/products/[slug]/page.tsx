import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flag,
  Medal,
  Search,
  Snowflake,
  Star,
  Thermometer,
  Waves,
} from "lucide-react";
import { ProductActionButtons } from "@/components/ui/ProductActionButtons";
import { ProductFaq } from "@/components/ui/ProductFaq";
import { ProductReviewSummary } from "@/components/ui/ProductReviewSummary";
import { prisma } from "@/lib/db";
import { ProductImageGallery } from "@/components/ui/ProductImageGallery";
import { ProductViewTracker } from "@/components/ui/ProductViewTracker";
import { parsePrice } from "@/lib/parse-price";
import { SITE_URL as BASE } from "@/lib/constants";
import sanitizeHtml from "sanitize-html";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({ select: { slug: true } });
    return products.filter(p => p.slug).map(p => ({ slug: p.slug! }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await prisma.product.findFirst({ where: { slug } });
    if (!product) return {};

    const title = `${product.name} | Nahian Fashion`;
    const rawDesc = product.description
      ? sanitizeHtml(product.description, { allowedTags: [], allowedAttributes: {} })
      : "";
    const description = rawDesc
      ? rawDesc.slice(0, 155)
      : `Buy ${product.name} online — premium single-estate tea from the Sylhet hills of Bangladesh.`;
    const image =
      Array.isArray(product.media_urls) && (product.media_urls as string[]).length > 0
        ? (product.media_urls as string[])[0]
        : `${BASE}/logo.png`;
    const url = `${BASE}/products/${slug}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: "website",
        images: [{ url: image, width: 800, height: 800, alt: product.name }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {};
  }
}

export default async function SingleProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: any = null;

  try {
    product = await prisma.product.findFirst({ where: { slug } });
    if (!product) return notFound();
  } catch {
    return notFound();
  }

  let reviews: any[] = [];
  try {
    reviews = await prisma.productReview.findMany({
      where: { product_id: product.id },
      orderBy: { created_at: 'desc' },
    });
  } catch (error) {
    console.error("Failed to fetch reviews", error);
  }

  let siteSettings: { whatsapp_number?: string | null; phone_number?: string | null } = {};
  try {
    siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { whatsapp_number: true, phone_number: true },
    }) ?? {};
  } catch {
    // non-fatal
  }

  const images =
    Array.isArray(product!.media_urls) && product!.media_urls.length > 0
      ? product!.media_urls
      : ["https://images.unsplash.com/photo-1563911892437-1feda0179e1b?q=80&w=1200&auto=format&fit=crop"];

  const productImage =
    Array.isArray(product.media_urls) && (product.media_urls as string[]).length > 0
      ? (product.media_urls as string[])[0]
      : null;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.detail || "",
    image: productImage ? [productImage] : [],
    sku: product.id,
    url: `${BASE}/products/${product.slug}`,
    brand: { "@type": "Brand", name: "Nahian Fashion" },
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: parsePrice(product.price),
      availability: product.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${BASE}/products/${product.slug}`,
      seller: { "@type": "Organization", name: "Nahian Fashion" },
    },
    ...(reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (
          reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
        ).toFixed(1),
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Products", item: `${BASE}/collections/all` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${BASE}/products/${product.slug}` },
    ],
  };

  const numericPrice = parsePrice(product.price);

  return (
    <article className="bg-white">
      <ProductViewTracker
        productId={product.id}
        productName={product.name}
        price={numericPrice}
        category={product.category}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="px-6 pb-[86px] pt-8 md:px-[352px]">
        <nav aria-label="Breadcrumb" className="text-[14px] mb-8 flex flex-wrap items-center gap-1.5 text-[#555]">
          <Link href="/" className="hover:text-black">Home</Link>
          <span aria-hidden="true">&gt;</span>
          <Link href="/collections/all" className="hover:text-black">Products</Link>
          <span aria-hidden="true">&gt;</span>
          <span className="text-[#ac8545]" aria-current="page">{product?.name}</span>
        </nav>

        <div className="grid items-start gap-8 md:gap-14 md:grid-cols-[1fr_1fr]">
          <ProductImageGallery images={images} productName={product?.name || ""} />

          {/* Details Section */}
          <div className="flex flex-col md:pt-4">
            <h1 className="font-heading text-[30px] md:text-[38px] leading-[1.1] text-[#222]">
              {product?.name}
            </h1>
            
            <ProductReviewSummary reviews={reviews} productId={product?.id || "demo-id"} />
            
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="text-[32px] text-[#222] font-bold">
                {product?.price?.includes("Tk") || product?.price?.includes("৳") 
                  ? product?.price.replace("Tk", "৳") 
                  : `৳ ${product?.price}`}
              </span>
              {product?.original_price && (
                <span className="text-[20px] text-[#999] line-through font-bold">
                  {product?.original_price?.includes("Tk") || product?.original_price?.includes("৳") 
                    ? product?.original_price.replace("Tk", "৳") 
                    : `৳ ${product?.original_price}`}
                </span>
              )}
              {product?.discount && (
                <span className="bg-[#f8f5f0] px-3 py-1 text-[13px] font-bold tracking-wide text-[#ac8545]">{product.discount}</span>
              )}
              {product?.per_cup_price && (
                <span className="border border-[#eee] bg-[#fdfdfd] px-3 py-1 text-[13px] flex items-center gap-2 text-[#ac8545]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 stroke-[1.5]">
                    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3M10 1v3M14 1v3" />
                  </svg>
                  {product.per_cup_price}
                </span>
              )}
            </div>

            {product?.detail && (
              <p className="mt-6 text-[14px] md:text-[15px] text-[#ac8545]">{product.detail}</p>
            )}

            {product?.description && (
              <div
                className="product-description mt-4 text-[15px] md:text-[16px] leading-[1.6] text-[#333]"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(product.description, {
                    allowedTags: ['p','br','strong','em','s','ul','ol','li','mark','span'],
                    allowedAttributes: { mark: ['style'], span: ['style'] },
                    allowedStyles: {
                      '*': { color: [/.*/], 'background-color': [/.*/] },
                    },
                  }),
                }}
              />
            )}
            
            <ProductActionButtons
              product={{
                id: product?.id || "demo-id",
                name: product?.name || "Unknown Product",
                price: product?.price || "",
                image: product?.media_urls?.[0] || "",
                detail: product?.detail || "",
                originalPrice: product?.original_price || "",
                discount: product?.discount || "",
                category: product?.category || "",
              }}
              whatsappNumber={siteSettings.whatsapp_number ?? undefined}
              phoneNumber={siteSettings.phone_number ?? undefined}
            />
            
            <div className="mt-8 flex items-start gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6 shrink-0 text-[#ac8545] stroke-[1.5]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              <p className="text-[14px] text-[#ac8545] pt-1">
                Delivery within 2-3 business days
              </p>
            </div>
            {product?.packaging && (
              <p className="mt-4 text-[14px] text-[#222] font-bold">
                Packaging - <span className="font-normal text-[#555]">{product.packaging}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {product?.steeping?.enabled && <Steeping data={product.steeping} />}
      <ProductFaq faqs={product?.faqs} productId={product?.id || "demo-id"} />
    </article>
  );
}

function Steeping({ data }: { data: any }) {
  if (!data) return null;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'cup-spoon': return <CupSpoonIcon />;
      case 'pour': return <PourIcon />;
      case 'thermo': return <ThermoIcon />;
      case 'teapot': return <TeapotIcon />;
      case 'milk': return <MilkIcon />;
      case 'iced-spoon': return <IcedSpoonIcon />;
      case 'iced-drink': return <IcedDrinkIcon />;
      default: return <CupSpoonIcon />;
    }
  };

  return (
    <section className="bg-[#fcfaf7] px-6 py-[60px] md:py-[100px]">
      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1fr_1fr] md:gap-[80px] items-stretch">
        
        {/* Left Column: Image */}
        <div className="overflow-hidden shadow-sm h-full">
          <img
            src={data.image_url || "https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?q=80&w=1200&auto=format&fit=crop"}
            alt="Tea being poured into a cup"
            className="w-full h-full object-cover min-h-[400px]"
          />
        </div>

        {/* Right Column: Instructions */}
        <div className="px-2 md:px-0 flex flex-col justify-center py-4">
          <div className="mb-8 text-center md:text-left">
            <p className="text-[13px] font-bold uppercase tracking-widest text-[#222]">How To Brew</p>
            <h2 className="mt-2 font-heading text-[32px] md:text-[42px] text-[#ac8545]">Steeping Instructions</h2>
          </div>

          {data.hot_brew && data.hot_brew.length > 0 && (
            <>
              <h3 className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-[#222] mb-6 text-center md:text-left">Hot Brew</h3>
              <div className="space-y-5">
                {data.hot_brew.map((step: any, idx: number) => (
                  <Brew 
                    key={step.id || idx}
                    icon={renderIcon(step.iconType)} 
                    step={step.step} 
                    text={step.text} 
                  />
                ))}
              </div>
            </>
          )}

          {data.iced_brew && data.iced_brew.length > 0 && (
            <>
              <div className="mt-10 mb-6 md:mt-12">
                <h3 className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-[#222] text-center md:text-left">Iced Brew</h3>
              </div>
              <div className="space-y-5">
                {data.iced_brew.map((step: any, idx: number) => (
                  <Brew 
                    key={step.id || idx}
                    icon={renderIcon(step.iconType)} 
                    step={step.step} 
                    text={step.text} 
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Brew({ icon, step, text }: { icon: ReactNode; step: string; text: string }) {
  return (
    <div className="grid grid-cols-[60px_1fr] md:grid-cols-[70px_1fr] items-start gap-4 md:gap-6">
      <div className="text-[#ac8545] [&_svg]:h-[40px] [&_svg]:w-[40px] md:[&_svg]:h-[50px] md:[&_svg]:w-[50px] [&_svg]:stroke-[1.2] flex justify-center mt-1">
        {icon}
      </div>
      <div>
        <span className="block text-[14px] text-[#ac8545] mb-1">{step}</span>
        <p className="text-[15px] md:text-[16px] text-[#333] leading-snug">{text}</p>
      </div>
    </div>
  );
}

function CupSpoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M5 14a6 6 0 0 0 12 0V7H5v7z" />
      <path d="M17 9h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2" />
      <path d="M3 19h18" />
      <path d="M13 2l3 3" />
    </svg>
  );
}

function PourIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 2v6" strokeDasharray="2 2" />
      <path d="M8 8h8v9a4 4 0 0 1-8 0V8z" />
      <path d="M16 10l3-3" />
    </svg>
  );
}

function ThermoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      <path d="M11.5 8v6" />
      <circle cx="11.5" cy="16.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function TeapotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M8 10h8a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v0a4 4 0 0 1 4-4z" />
      <path d="M12 10V6" />
      <path d="M10 6h4" />
      <path d="M4 14c-1.5-1-3-1-3-3s2-2 3-2" />
      <path d="M20 14h2" />
    </svg>
  );
}

function MilkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M7 6h10v14H7z" />
      <path d="M7 6l5-4 5 4" />
      <path d="M10 11h4" />
    </svg>
  );
}

function IcedSpoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M8 4h8l-1 16H9L8 4z" />
      <path d="M16 4l3-3" />
    </svg>
  );
}

function IcedDrinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M8 6h8l-1 14H9L8 6z" />
      <path d="M12 6V2" />
      <path d="M10 12l2-2" />
      <path d="M12 16l2-2" />
    </svg>
  );
}

// The Faq component is now imported from @/components/ui/ProductFaq
