import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

type LineItem = { productId: string; quantity: number };

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  // 5 orders per hour per IP
  if (!checkRateLimit(`order:${ip}`, 5, 60 * 60 * 1000).allowed) {
    return NextResponse.json(
      { error: 'Too many orders created from this IP. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { customerId, name, phone, address, items, paymentMethod, couponCode, selectedDistrictId } = body as {
      customerId?: string | null;
      name: string;
      phone: string;
      address: string;
      items: LineItem[];
      paymentMethod: string;
      couponCode?: string;
      selectedDistrictId?: string;
    };

    if (!name || !phone || !address || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (items.length > 50) {
      return NextResponse.json({ error: 'Order cannot contain more than 50 items' }, { status: 400 });
    }
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json({ error: 'Invalid product ID in items' }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return NextResponse.json({ error: 'Item quantity must be between 1 and 100' }, { status: 400 });
      }
    }
    const ALLOWED_PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'card'];
    if (!paymentMethod || !ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    const finalOrderId = `SV-${randomBytes(16).toString('hex').toUpperCase()}`;

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, media_urls: true },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: 'Failed to verify product prices' }, { status: 400 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const resolvedItems: Array<{
      product_id: string;
      product_name: string;
      price: number;
      quantity: number;
      image_url: string;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 400 });
      }
      const trustedPrice = parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0;
      subtotal += trustedPrice * item.quantity;

      const mediaUrls = product.media_urls as string[];
      const imageUrl = Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0] : '';

      resolvedItems.push({
        product_id: product.id,
        product_name: product.name,
        price: trustedPrice,
        quantity: item.quantity,
        image_url: imageUrl,
      });
    }

    const isDhaka = selectedDistrictId === '47';
    const shipping = selectedDistrictId ? (isDhaka ? 70 : 130) : 130;

    // Resolve coupon details before the transaction
    let discount = 0;
    let appliedCouponCode: string | null = null;
    let couponMaxUses = 0;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (coupon && coupon.is_active) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
        const meetsMin = !coupon.min_order || subtotal >= Number(coupon.min_order);

        if (notExpired && meetsMin) {
          discount =
            coupon.type === 'percent'
              ? (subtotal * Number(coupon.value)) / 100
              : Math.min(Number(coupon.value), subtotal);
          appliedCouponCode = coupon.code;
          couponMaxUses = coupon.max_uses;
        }
      }
    }

    const total = subtotal - discount + shipping;

    // Atomic transaction: coupon usage is incremented with a DB-level guard
    // (used_count < max_uses in the WHERE clause prevents over-use even under concurrency)
    const order = await prisma.$transaction(async (tx) => {
      if (appliedCouponCode) {
        const updated = await tx.coupon.updateMany({
          where: {
            code: appliedCouponCode,
            is_active: true,
            used_count: { lt: couponMaxUses },
          },
          data: { used_count: { increment: 1 } },
        });

        if (updated.count === 0) {
          throw new Error('COUPON_EXHAUSTED');
        }
      }

      return tx.order.create({
        data: {
          order_id: finalOrderId,
          user_id: customerId || null,
          customer_name: name,
          phone,
          address,
          subtotal,
          shipping,
          discount,
          total,
          payment_method: paymentMethod,
          amount_paid: paymentMethod !== 'cash' ? total : 0,
          status: 'pending',
          items: {
            create: resolvedItems,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      orderId: order.order_id,
      total,
      subtotal,
      shipping,
      discount,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'COUPON_EXHAUSTED') {
      return NextResponse.json({ error: 'Coupon usage limit has been reached.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
