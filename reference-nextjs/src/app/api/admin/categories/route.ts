import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { r2Delete } from '@/lib/r2';

const revalidateSite = () => revalidatePath('/');

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
  const data = await prisma.category.update({ where: { id }, data: body });
  revalidateSite();
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
