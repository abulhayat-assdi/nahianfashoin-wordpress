import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { r2Delete } from '@/lib/r2';

export async function GET() {
  const data = await prisma.homeConfig.findUnique({ where: { id: 1 } });
  return NextResponse.json({ data: data || null });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { id: _id, updated_at: _updated, ...rest } = body;

    const oldConfig = await prisma.homeConfig.findUnique({ where: { id: 1 } });

    const data = await prisma.homeConfig.upsert({
      where: { id: 1 },
      update: rest,
      create: { id: 1, ...rest },
    });

    // Clean up removed or replaced images from R2
    if (oldConfig) {
      type Banner = { id: string; image_url: string };
      const oldBanners = (oldConfig.banners as Banner[] | null) ?? [];
      const newBanners = (rest.banners as Banner[] | null) ?? oldBanners;
      const newBannerUrls = new Set(newBanners.map((b) => b.image_url).filter(Boolean));
      const removedBannerUrls = oldBanners.map((b) => b.image_url).filter((u) => u && !newBannerUrls.has(u));
      await Promise.all(removedBannerUrls.map(r2Delete));

      const oldShopImg = (oldConfig.data as Record<string, unknown> | null)?.shop_menu_image as string | undefined;
      const newShopImg = (rest.data as Record<string, unknown> | undefined)?.shop_menu_image as string | undefined;
      if (oldShopImg && newShopImg !== undefined && oldShopImg !== newShopImg) {
        await r2Delete(oldShopImg);
      }
    }

    revalidateTag('home-config', 'max');
    revalidatePath('/');
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
