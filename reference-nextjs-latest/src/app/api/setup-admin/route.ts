import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';

// One-time admin setup endpoint — automatically disabled once any admin exists
export async function POST(req: NextRequest) {
  // Check if any admin already exists — if so, this endpoint is permanently disabled
  const existingAdmin = await prisma.customer.findFirst({
    where: { role: { in: ['admin', 'super_admin'] } },
    select: { id: true },
  });
  if (existingAdmin) {
    return NextResponse.json({ error: 'Setup already completed. This endpoint is disabled.' }, { status: 410 });
  }

  const secret = req.headers.get('x-setup-secret');
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, email, password, role } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }
    if (role && !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const password_hash = await hash(password, 12);

    const user = await prisma.customer.upsert({
      where: { email },
      update: { role: role || 'super_admin', password_hash, name: name || email },
      create: { email, name: name || email, role: role || 'super_admin', password_hash },
    });

    return NextResponse.json({ ok: true, email: user.email, role: user.role });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
