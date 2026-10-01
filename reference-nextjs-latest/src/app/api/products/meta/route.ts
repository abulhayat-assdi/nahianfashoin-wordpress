import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public endpoint — returns colors & sizes for given product IDs.
// Used by checkout to enrich cart items that are missing this metadata.
export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ data: [] });
    }
    const products = await prisma.product.findMany({
      where: { id: { in: ids.slice(0, 50) }, is_available: true },
      select: { id: true, colors: true, sizes: true },
    });
    return NextResponse.json({ data: products });
  } catch {
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
