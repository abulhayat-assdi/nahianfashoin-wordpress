import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (email) {
    const customer = await prisma.customer.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, created_at: true },
    });
    return NextResponse.json({ data: customer });
  }

  const data = await prisma.customer.findMany({
    orderBy: { created_at: 'desc' },
    select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
  });
  return NextResponse.json({ data });
}
