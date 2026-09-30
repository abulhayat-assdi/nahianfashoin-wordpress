import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await prisma.coupon.findMany({ orderBy: { created_at: 'desc' } });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const data = await prisma.coupon.create({ data: body });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, ...body } = await req.json();
  const data = await prisma.coupon.update({ where: { id }, data: body });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await req.json();
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
