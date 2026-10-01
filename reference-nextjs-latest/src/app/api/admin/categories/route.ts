import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { r2Delete } from '@/lib/r2';

const revalidateSite = () => {
  // Invalidate unstable_cache entries
  revalidateTag('categories', 'max');
  revalidateTag('products', 'max');
  // Invalidate ISR page cache
  revalidatePath('/');
  revalidatePath('/collections/all');
  revalidatePath('/collections/[slug]', 'page');
};

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await prisma.category.findMany({ orderBy: { display_order: 'asc' } });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const data = await prisma.category.create({ data: body });
  revalidateSite();
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, ...body } = await req.json();

  const old = await prisma.category.findUnique({ where: { id }, select: { name: true, image_url: true } });

  const data = await prisma.$transaction(async (tx) => {
    if (old && body.name && old.name !== body.name) {
      await tx.product.updateMany({
        where: { category: old.name },
        data: { category: body.name },
      });
    }
    return tx.category.update({ where: { id }, data: body });
  });

  // Delete old image if it was replaced
  if (old?.image_url && body.image_url !== undefined && old.image_url !== body.image_url) {
    await r2Delete(old.image_url);
  }

  revalidateSite();
  revalidatePath('/collections/all');
  revalidatePath('/collections/[slug]', 'page');
  revalidatePath('/products/[slug]', 'page');
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await req.json();
  const category = await prisma.category.findUnique({ where: { id }, select: { image_url: true } });
  await prisma.category.delete({ where: { id } });
  revalidateSite();

  if (category?.image_url) await r2Delete(category.image_url);

  return NextResponse.json({ success: true });
}
