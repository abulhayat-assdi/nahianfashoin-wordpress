import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createToken, COOKIE_OPTIONS } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  // 5 registrations per hour per IP
  if (!checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const { name, email, phone, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const password_hash = await hash(password, 12);
    const customer = await prisma.customer.create({
      data: { name, email, phone: phone || null, password_hash, role: 'customer' },
    });

    const token = await createToken({
      sub: customer.id,
      email: customer.email,
      name: customer.name,
      role: customer.role,
    });

    const user = { id: customer.id, email: customer.email, name: customer.name, role: customer.role };
    const res = NextResponse.json({ user });
    res.cookies.set('nahian-auth', token, COOKIE_OPTIONS);
    return res;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
