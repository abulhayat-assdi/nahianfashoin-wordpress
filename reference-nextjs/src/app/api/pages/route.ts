import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section');
  const slug = searchParams.get('slug');

  if (slug) {
    const data = await prisma.page.findUnique({ where: { slug } });
    return NextResponse.json({ data: data || null });
  }

  const data = await prisma.page.findMany({
    where: section ? { section } : undefined,
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { slug, ...rest } = body;

    const data = await prisma.page.upsert({
      where: { slug },
      update: rest,
      create: { slug, ...rest },
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { slug } = await req.json();
    await prisma.page.delete({ where: { slug } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
