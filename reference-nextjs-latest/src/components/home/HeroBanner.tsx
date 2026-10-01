import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import HeroSlider from "./HeroSlider";

const getHomeConfig = unstable_cache(
  async () => {
    try {
      return await prisma.homeConfig.findUnique({ where: { id: 1 } });
    } catch {
      return null;
    }
  },
  ["home-config"],
  { revalidate: 3600, tags: ["home-config"] }
);

export default async function HeroBanner() {
  const config = await getHomeConfig();
  const banners = (config?.banners as { image_url: string; link?: string }[] | null) || [];
  const heroText = (config?.data as any)?.hero_text || {};

  return <HeroSlider banners={banners} heroText={heroText} />;
}
