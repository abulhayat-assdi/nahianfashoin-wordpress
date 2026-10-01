import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  if (!checkRateLimit(`coupon-validate:${ip}`, 20, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { code, subtotal } = await req.json() as { code: string; subtotal: number };

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
    }
    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json({ error: 'Invalid subtotal.' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.is_active) {
      return NextResponse.json({ error: 'Invalid or expired coupon code.' }, { status: 404 });
    }

    const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
    if (!notExpired) {
      return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
    }

    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit.' }, { status: 400 });
    }

    if (coupon.min_order && subtotal < Number(coupon.min_order)) {
      return NextResponse.json(
        { error: `Minimum order of ৳${Number(coupon.min_order).toLocaleString()} required for this coupon.` },
        { status: 400 }
      );
    }

    const discount = Math.min(
      coupon.type === 'percent'
        ? (subtotal * Math.min(Number(coupon.value), 100)) / 100
        : Number(coupon.value),
      subtotal
    );

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount: Math.round(discount * 100) / 100,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
