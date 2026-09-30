import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { sendCustomerPasswordResetEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  if (!checkRateLimit(`forgot-pw:${ip}`, 3, 15 * 60 * 1000).allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!customer || !customer.password_hash) {
      return NextResponse.json({ success: true });
    }

    // Invalidate existing unused tokens
    await prisma.passwordResetToken.updateMany({
      where: { email: customer.email, type: 'customer', used: false },
      data: { used: true },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token, email: customer.email, type: 'customer', expires_at: expiresAt },
    });

    await sendCustomerPasswordResetEmail(customer.email, token);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
