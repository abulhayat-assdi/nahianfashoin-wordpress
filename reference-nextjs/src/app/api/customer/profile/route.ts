import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('surma-auth')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const customer = await prisma.customer.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, phone: true, address: true, role: true },
  });

  return NextResponse.json({ data: customer });
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get('surma-auth')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, phone, address } = await req.json();
  const customer = await prisma.customer.update({
    where: { id: payload.sub },
    data: { name, phone, address },
    select: { id: true, name: true, email: true, phone: true, address: true },
  });

  return NextResponse.json({ data: customer });
}
