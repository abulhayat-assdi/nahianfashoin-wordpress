import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { r2Delete } from '@/lib/r2';

const revalidateSite = () => {
  revalidatePath('/');
  revalidatePath('/collections/all');
  revalidatePath('/collections/[slug]', 'page');
};

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const products = await prisma.product.findMany({ orderBy: { created_at: 'desc' } });
  return NextResponse.json({ data: products });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const product = await prisma.product.create({ data: body });
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
    const product = await prisma.product.update({ where: { id }, data });
    revalidateSite();
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
