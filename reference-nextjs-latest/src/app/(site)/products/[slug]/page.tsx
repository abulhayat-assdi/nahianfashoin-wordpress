import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ProductActionButtons } from "@/components/ui/ProductActionButtons";
import { ProductFaq } from "@/components/ui/ProductFaq";
import { ProductReviewSummary } from "@/components/ui/ProductReviewSummary";
import SizeChartTable from "@/components/ui/SizeChartTable";
import { prisma } from "@/lib/db";
import { ProductImageGallery } from "@/components/ui/ProductImageGallery";
import { ProductViewTracker } from "@/components/ui/ProductViewTracker";
import RelatedProducts from "@/components/ui/RelatedProducts";
import { parsePrice } from "@/lib/parse-price";
import { SITE_URL as BASE } from "@/lib/constants";
import sanitizeHtml from "sanitize-html";

export const revalidate = 3600;
export const dynamicParams = true;

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
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  try {
    const product = await prisma.product.findFirst({ where: { slug } });
    if (!product) return {};

    const title = `${product.name} | Nahian Fashion`;
    const rawDesc = product.description
      ? sanitizeHtml(product.description, { allowedTags: [], allowedAttributes: {} })
      : "";
    const description = rawDesc
      ? rawDesc.slice(0, 155)
      : `Buy ${product.name} online — premium quality fashion from Nahian Fashion, Bangladesh.`;
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
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  let product: any = null;

  try {
    product = await prisma.product.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
    });
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

  let relatedProducts: any[] = [];
  try {
    relatedProducts = await prisma.product.findMany({
      where: {
        category: { equals: product.category, mode: "insensitive" },
        is_available: true,
        NOT: { id: product.id },
      },
      orderBy: [{ display_order: "asc" }, { created_at: "desc" }],
      take: 8,
      include: { _count: { select: { reviews: true } } },
    });
  } catch (error) {
    console.error("Failed to fetch related products", error);
  }

  const mainImages =
    Array.isArray(product!.media_urls) && product!.media_urls.length > 0
      ? (product!.media_urls as string[])
      : ["https://images.unsplash.com/photo-1563911892437-1feda0179e1b?q=80&w=1200&auto=format&fit=crop"];

  const colorImages = Array.isArray(product?.colors)
    ? (product.colors as string[]).filter((c: string) => c.startsWith("http") || c.startsWith("/"))
    : [];

  const images = [...mainImages, ...colorImages];
  const colorImageOffset = mainImages.length;

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
      <section className="bg-white pt-1 pb-4 md:pb-20">
        <div className="mx-auto max-w-[1280px] px-3 md:px-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-[11px] mb-1.5 flex flex-wrap items-center gap-1 text-[#999]">
            <Link href="/" className="hover:text-[#1a3c2e]">Home</Link>
            <span>/</span>
            <Link href="/collections/all" className="hover:text-[#1a3c2e]">Products</Link>
            <span>/</span>
            <span className="text-[#1a1a1a]" aria-current="page">{product?.name}</span>
          </nav>

          <div className="grid items-start gap-2 md:gap-12 md:grid-cols-[1fr_1fr]">
            <ProductImageGallery images={images} productName={product?.name || ""} />

            {/* Details Section */}
            <div className="flex flex-col">
              <h1 className="font-heading text-[17px] md:text-[32px] font-bold leading-tight text-[#1a1a1a]">
                {product?.name}
              </h1>

              {/* Price */}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-[18px] md:text-[32px] font-bold text-[#1a3c2e]">
                  {product?.price?.includes("Tk") || product?.price?.includes("৳")
                    ? product?.price.replace("Tk", "৳")
                    : `৳${product?.price}`}
                </span>
                {product?.original_price && (
                  <span className="text-[16px] text-[#aaa] line-through">
                    {product?.original_price?.includes("Tk") || product?.original_price?.includes("৳")
                      ? product?.original_price.replace("Tk", "৳")
                      : `৳${product?.original_price}`}
                  </span>
                )}
                {product?.discount && (
                  <span className="bg-red-500 text-white px-2 py-0.5 text-[12px] font-bold rounded">
                    {product.discount}
                  </span>
                )}
              </div>

              {/* Action Buttons (size/color/quantity/buy) — appear before description */}
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
                colors={Array.isArray(product?.colors) ? (product.colors as string[]) : []}
                sizes={Array.isArray(product?.sizes) ? (product.sizes as any[]).map((s: any) => typeof s === 'string' ? { size: s, available: true } : s) : []}
                colorImageOffset={colorImageOffset}
              />

              {/* Delivery note */}
              <div className="mt-4 flex items-center gap-2 text-[13px] text-[#777]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0 text-[#1a3c2e]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                ২-৩ কার্যদিবসের মধ্যে ডেলিভারি
              </div>

              {/* Product Details — below action buttons */}
              {(product?.detail || product?.description) && (
                <div className="mt-5 border-t border-[#f0f0f0] pt-4">
                  <h2 className="text-[15px] font-bold uppercase tracking-wide text-[#1a1a1a] mb-3">
                    Product Details
                  </h2>
                  {product?.detail && (
                    <p className="text-[14px] text-[#555] leading-relaxed">{product.detail}</p>
                  )}
                  {product?.description && (
                    <div
                      className="product-description mt-3 text-[14px] md:text-[15px] leading-[1.7] text-[#444]"
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          try {
                            return sanitizeHtml(product.description, {
                              allowedTags: ["p", "br", "strong", "b", "em", "s", "ul", "ol", "li", "mark", "span", "h1", "h2", "h3", "h4", "h5", "h6"],
                              allowedAttributes: { mark: ["style"], span: ["style"] },
                              allowedStyles: {
                                "*": { color: [/.*/], "background-color": [/.*/] },
                              },
                            });
                          } catch {
                            return product.description;
                          }
                        })(),
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {product?.steeping?.enabled && <Steeping data={product.steeping} />}
      {product?.video_url && <ProductVideo url={product.video_url} title={product.name} />}
      <SizeChartTable />
      <ProductFaq faqs={product?.faqs} productId={product?.id || "demo-id"} />
      <RelatedProducts products={relatedProducts} category={product?.category} />
      <ProductReviewSummary reviews={reviews} productId={product?.id || "demo-id"} />
    </article>
  );
}

function getVideoEmbed(url: string): { type: "iframe" | "mp4"; src: string } | null {
  // YouTube — watch or youtu.be short link
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt[1]}?rel=0` };

  // Vimeo
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };

  // Direct video file
  if (/\.(mp4|webm|ogg|mov)$/i.test(url)) return { type: "mp4", src: url };

  return null;
}

function ProductVideo({ url, title }: { url: string; title: string }) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;

  return (
    <section className="bg-white px-3 md:px-10 py-6 md:py-12 border-t border-[#f0f0f0]">
      <div className="mx-auto max-w-[900px]">
        <h2 className="text-[15px] md:text-[20px] font-bold uppercase tracking-wide text-[#1a1a1a] mb-4">
          Product Video
        </h2>
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-md">
          {embed.type === "iframe" ? (
            <iframe
              src={embed.src}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <video
              src={embed.src}
              controls
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>
    </section>
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
