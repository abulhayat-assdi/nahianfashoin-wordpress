import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { is_active: true },
    select: { id: true, name: true, slug: true, image_url: true, display_order: true },
    orderBy: { display_order: 'asc' },
  });
  return NextResponse.json({ data: categories });
}
