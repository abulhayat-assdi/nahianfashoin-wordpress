import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET() {
  const data = await prisma.footerConfig.findUnique({ where: { id: 1 } });
  return NextResponse.json({ data: data || null });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { id: _id, ...rest } = body;

    const data = await prisma.footerConfig.upsert({
      where: { id: 1 },
      update: rest,
      create: { id: 1, ...rest },
    });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
