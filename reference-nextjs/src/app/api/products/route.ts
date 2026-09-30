import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const products = await prisma.product.findMany({
    where: { is_available: true },
    select: { id: true, slug: true, name: true, category: true, price: true, media_urls: true, is_gift: true, detail: true, original_price: true, discount: true, is_available: true, _count: { select: { reviews: true } } },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json({ data: products });
}
