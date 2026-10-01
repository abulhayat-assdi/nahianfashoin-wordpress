import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  if (!checkRateLimit(`admin-reset-pw:${ip}`, 5, 15 * 60 * 1000).allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { token, password } = body ?? {};

    if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.used || record.type !== 'admin' || record.expires_at < new Date()) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { email: record.email } });
    if (!customer || (customer.role !== 'admin' && customer.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Account not found or access denied.' }, { status: 403 });
    }

    const passwordHash = await hash(password, 12);

    await prisma.$transaction([
      prisma.customer.update({ where: { email: record.email }, data: { password_hash: passwordHash } }),
      prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin-reset-password]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
