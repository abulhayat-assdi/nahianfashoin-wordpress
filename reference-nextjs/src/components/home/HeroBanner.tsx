import Image from "next/image";
import Link from "next/link";
import Ticker from "@/components/layout/Ticker";
import { prisma } from "@/lib/db";

async function getHomeConfig() {
  try {
    return await prisma.homeConfig.findUnique({ where: { id: 1 } });
  } catch (err) {
    console.error("Error fetching home config:", err);
    return null;
  }
}

export default async function HeroBanner() {
  const config = await getHomeConfig();
  const banners = (config?.banners as { image_url: string }[] | null) || [];
  const banner = banners.length > 0 ? banners[0] : null;
  const tickerItems = (config?.ticker_items as string[]) || [];

  if (!banner && tickerItems.length === 0) {
    return null;
  }

  const isExternal = banner?.image_url?.startsWith("http");
  const isLocalUpload = banner?.image_url?.startsWith("/uploads/");

  return (
    <section className="relative w-full bg-white flex flex-col">
      {banner && (
        <Link
          href="/collections/all"
          className="relative block w-full h-[65vw] min-h-[280px] md:h-[calc(100vh-115px)] overflow-hidden"
          aria-label="Shop all Nahian Fashion teas"
        >
          <Image
            src={banner.image_url}
            alt="Nahian Fashion — Shop Premium Single Estate Tea from the Sylhet Hills"
            fill
            className="object-cover object-center transition-transform duration-[20s] hover:scale-105"
            priority
            sizes="100vw"
            unoptimized={isExternal || isLocalUpload}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"
            aria-hidden="true"
          />
        </Link>
      )}

      <div className="w-full z-20">
        <Ticker tickerItems={tickerItems} />
      </div>
    </section>
  );
}
