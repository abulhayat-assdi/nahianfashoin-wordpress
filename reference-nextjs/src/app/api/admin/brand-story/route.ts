import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

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
  const data = await prisma.brandStory.upsert({
    where: { id: 'main' },
    update: body,
    create: { id: 'main', ...body },
  });
  revalidatePath('/');
  return NextResponse.json({ data });
}
