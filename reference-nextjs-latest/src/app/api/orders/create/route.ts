import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendPurchaseEvent } from '@/lib/meta-capi';


type LineItem = { productId: string; quantity: number; size?: string | null; color?: string | null };

const PHONE_REGEX = /^01[3-9][0-9]{8}$/;

function normalizePhone(raw: string): string {
  let num = raw.replace(/[\s\-()]/g, '');
  if (num.startsWith('+880')) num = '0' + num.slice(4);
  else if (num.startsWith('880')) num = '0' + num.slice(3);
  return num;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  try {
    const body = await req.json();
    const { customerId, name, phone, address, items, paymentMethod, couponCode, selectedDistrictId, shippingZone } = body as {
      customerId?: string | null;
      name: string;
      phone: string;
      address: string;
      items: LineItem[];
      paymentMethod: string;
      couponCode?: string;
      selectedDistrictId?: string;
      shippingZone?: string;
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

    const normalizedPhone = normalizePhone(phone);
    if (!PHONE_REGEX.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'সঠিক মোবাইল নম্বর দিন — ১১ ডিজিটের বাংলাদেশি নম্বর (01XXXXXXXXX)।' },
        { status: 400 }
      );
    }

    // Blocked list check (Phone or IP)
    const cleanPhoneForBlockMatch = (phoneStr: string): string => {
      const cleaned = phoneStr.replace(/\D/g, '');
      return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
    };
    const blockMatchPhone = cleanPhoneForBlockMatch(normalizedPhone);

    const isBlocked = await prisma.blockedItem.findFirst({
      where: {
        OR: [
          { type: 'phone', value: { endsWith: blockMatchPhone } },
          ip !== 'unknown' ? { type: 'ip', value: ip } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: 'দুঃখিত, আপনার মোবাইল নম্বর অথবা ডিভাইসটি সাময়িকভাবে ব্লক করা হয়েছে। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।' },
        { status: 403 }
      );
    }

    // Only Cash on Delivery is accepted until a verified online payment gateway is integrated.
    if (paymentMethod !== 'cash') {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Rate limits run AFTER validation so malformed/bot requests don't burn the quota.
    // Phone-based limit is the primary guard: BD mobile carriers put thousands of
    // customers behind shared CGNAT IPs, so a tight per-IP limit blocks real buyers.
    if (!checkRateLimit(`order:phone:${normalizedPhone}`, 5, 60 * 60 * 1000).allowed) {
      return NextResponse.json(
        { error: 'এই নম্বর থেকে অল্প সময়ে অনেকগুলো অর্ডার এসেছে। কিছুক্ষণ পর আবার চেষ্টা করুন।' },
        { status: 429 }
      );
    }
    if (ip !== 'unknown' && !checkRateLimit(`order:ip:${ip}`, 30, 60 * 60 * 1000).allowed) {
      return NextResponse.json(
        { error: 'সার্ভার ব্যস্ত। কিছুক্ষণ পর আবার চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    // IP-based rate limiting (maximum 1 order per 12 hours from one device/IP)
    if (ip !== 'unknown') {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const existingOrderFromIp = await prisma.order.findFirst({
        where: {
          ip_address: ip,
          placed_at: { gte: twelveHoursAgo },
          status: { not: 'incomplete' },
        },
      });
      if (existingOrderFromIp) {
        return NextResponse.json(
          { error: 'আপনার ডিভাইস থেকে ইতিমধ্যে একটি অর্ডার করা হয়েছে। ১২ ঘন্টা পর আবার অর্ডার করতে পারবেন।' },
          { status: 400 }
        );
      }
    }

    const finalOrderId = `NF-${randomBytes(16).toString('hex').toUpperCase()}`;

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, media_urls: true, sizes: true, is_available: true },
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
      size: string | null;
      color: string | null;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 400 });
      }
      if (!product.is_available) {
        return NextResponse.json(
          { error: `"${product.name}" এই মুহূর্তে স্টকে নেই। পণ্যটি বাদ দিয়ে আবার চেষ্টা করুন।` },
          { status: 400 }
        );
      }

      // Reject sizes the admin has marked as stock-out
      const productSizes = Array.isArray(product.sizes)
        ? (product.sizes as Array<{ size?: string; available?: boolean }>)
        : [];
      if (item.size) {
        const sizeEntry = productSizes.find((s) => s.size === item.size);
        if (sizeEntry && sizeEntry.available === false) {
          return NextResponse.json(
            { error: `"${product.name}" এর "${item.size}" সাইজটি স্টকে নেই। অন্য সাইজ বেছে নিন।` },
            { status: 400 }
          );
        }
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
        size: item.size || null,
        color: item.color || null,
      });
    }

    const isDhaka = shippingZone === 'inside' || selectedDistrictId === '47';
    const shipping = isDhaka ? 70 : 120;

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
              ? (subtotal * Math.min(Number(coupon.value), 100)) / 100
              : Math.min(Number(coupon.value), subtotal);
          discount = Math.min(discount, subtotal);
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
          phone: normalizedPhone,
          address,
          subtotal,
          shipping,
          discount,
          total,
          payment_method: paymentMethod,
          amount_paid: 0,
          status: 'pending',
          capi_sent: true,
          ip_address: ip !== 'unknown' ? ip : null,
          items: {
            create: resolvedItems,
          },
        },
      });
    });

    // Server-side Meta Conversions API Purchase event (fire-and-forget; never blocks the order).
    // event_id = orderId — the thank-you page pushes the same event_id into the dataLayer,
    // and GTM forwards it to fbq('track','Purchase',{...},{eventID:orderId}).
    // Meta sees matching event_name + event_id → counts the purchase only once.
    // Guard: only fire for real orders (not drafts/incomplete), and never re-fire.
    if (order.status !== 'incomplete' && order.status !== 'failed') {
      void sendPurchaseEvent({
        orderId: order.order_id,
        total,
        phone: normalizedPhone,
        customerName: name,
        clientIp: ip,
        userAgent: req.headers.get('user-agent') || undefined,
        eventSourceUrl: `https://nahianfashion.com/thank-you/${order.order_id}`,
        contents: resolvedItems.map((i) => ({ id: i.product_id, quantity: i.quantity, item_price: i.price })),
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order.order_id,
      total,
      subtotal,
      shipping,
      discount,
      // Tells the thank-you page that server CAPI was already sent
      purchaseTracked: true,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'COUPON_EXHAUSTED') {
      return NextResponse.json({ error: 'কুপনটির ব্যবহারসীমা শেষ হয়ে গেছে।' }, { status: 400 });
    }
    console.error('[ORDER] create failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
