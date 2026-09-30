import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createToken, COOKIE_OPTIONS } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  // 10 attempts per 15 minutes per IP
  if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000).allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer || !customer.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await compare(password, customer.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await createToken({
      sub: customer.id,
      email: customer.email,
      name: customer.name,
      role: customer.role,
    });

    const user = { id: customer.id, email: customer.email, name: customer.name, role: customer.role };
    const res = NextResponse.json({ user });
    res.cookies.set('surma-auth', token, COOKIE_OPTIONS);
    return res;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
