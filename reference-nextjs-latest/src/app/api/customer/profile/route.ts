import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('nahian-auth')?.value;
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
  const token = req.cookies.get('nahian-auth')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
  const address = typeof body.address === 'string' ? body.address.trim() : undefined;

  if (name !== undefined && name.length > 100) {
    return NextResponse.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 });
  }
  if (phone !== undefined && phone.length > 20) {
    return NextResponse.json({ error: 'Phone must be 20 characters or fewer' }, { status: 400 });
  }
  if (address !== undefined && address.length > 500) {
    return NextResponse.json({ error: 'Address must be 500 characters or fewer' }, { status: 400 });
  }

  const customer = await prisma.customer.update({
    where: { id: payload.sub },
    data: { name, phone, address },
    select: { id: true, name: true, email: true, phone: true, address: true },
  });

  return NextResponse.json({ data: customer });
}
