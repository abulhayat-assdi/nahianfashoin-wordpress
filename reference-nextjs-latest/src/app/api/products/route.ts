import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { is_available: true },
      select: { id: true, slug: true, name: true, category: true, price: true, media_urls: true, is_featured: true, detail: true, original_price: true, discount: true, is_available: true, _count: { select: { reviews: true } } },
      orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }],
    });
    return NextResponse.json({ data: products });
  } catch {
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
