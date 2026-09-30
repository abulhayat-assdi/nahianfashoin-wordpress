import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET() {
  const data = await prisma.homeConfig.findUnique({ where: { id: 1 } });
  return NextResponse.json({ data: data || null });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { id: _id, updated_at: _updated, ...rest } = body;

    const data = await prisma.homeConfig.upsert({
      where: { id: 1 },
      update: rest,
      create: { id: 1, ...rest },
    });

    revalidatePath('/');
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
