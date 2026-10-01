import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { r2Delete } from '@/lib/r2';

const revalidateSite = () => {
  // Invalidate unstable_cache entries that use these tags
  revalidateTag('products', 'max');
  revalidateTag('categories', 'max');
  // Invalidate ISR page cache
  revalidatePath('/');
  revalidatePath('/collections/all');
  revalidatePath('/collections/[slug]', 'page');
  revalidatePath('/products/[slug]', 'page');
};

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const products = await prisma.product.findMany({ orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }] });
  return NextResponse.json({ data: products });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      slug, name, detail, description, price, original_price, discount,
      per_cup_price, packaging, media_urls, category, video_url, is_available,
      is_featured, is_gift, faqs, steeping, colors, sizes, display_order,
    } = body;
    const product = await prisma.product.create({
      data: {
        slug, name, detail, description, price, original_price, discount,
        per_cup_price, packaging, media_urls, category, video_url, is_available,
        is_featured, is_gift, faqs, steeping, colors, sizes, display_order,
      },
    });
    revalidateSite();
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id, ...data } = await req.json();
    const old = await prisma.product.findUnique({ where: { id }, select: { media_urls: true } });
    const product = await prisma.product.update({ where: { id }, data });
    revalidateSite();

    // Delete media files that were removed from the product
    if (old?.media_urls && data.media_urls !== undefined) {
      const oldUrls = (old.media_urls as string[]).filter((u): u is string => typeof u === 'string');
      const newUrls = new Set((data.media_urls as string[]).filter((u): u is string => typeof u === 'string'));
      const removed = oldUrls.filter((u) => !newUrls.has(u));
      await Promise.all(removed.map(r2Delete));
    }

    return NextResponse.json({ data: product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await req.json();
    const product = await prisma.product.findUnique({ where: { id }, select: { media_urls: true } });
    await prisma.product.delete({ where: { id } });
    revalidateSite();

    // Delete associated media files from R2
    if (product?.media_urls) {
      const urls = product.media_urls as string[];
      await Promise.all(urls.filter((u): u is string => typeof u === 'string').map(r2Delete));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
