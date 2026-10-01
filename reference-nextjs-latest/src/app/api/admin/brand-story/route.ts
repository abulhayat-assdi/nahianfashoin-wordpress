import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { r2Delete } from '@/lib/r2';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await prisma.brandStory.findUnique({ where: { id: 'main' } });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const old = await prisma.brandStory.findUnique({ where: { id: 'main' }, select: { founder_image: true, farmers_image: true } });
  const data = await prisma.brandStory.upsert({
    where: { id: 'main' },
    update: body,
    create: { id: 'main', ...body },
  });
  revalidatePath('/');

  // Delete replaced images
  if (old?.founder_image && body.founder_image !== undefined && old.founder_image !== body.founder_image) {
    await r2Delete(old.founder_image);
  }
  if (old?.farmers_image && body.farmers_image !== undefined && old.farmers_image !== body.farmers_image) {
    await r2Delete(old.farmers_image);
  }

  return NextResponse.json({ data });
}
