import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

function parsePrice(raw: unknown): number {
  return parseFloat(String(raw).replace(/[^0-9.]/g, '')) || 0;
}

// POST — create or update a draft (incomplete) order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, name, phone, address, items = [], shippingZone } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    const shippingCharge = shippingZone === 'inside' ? 70 : 120;
    const subtotal = (items as any[]).reduce((acc, item) => {
      return acc + parsePrice(item.price) * (item.quantity || 1);
    }, 0);
    const total = subtotal + shippingCharge;

    const customerName = (name || '').trim() || '—';
    const customerPhone = (phone || '').trim() || '—';
    const customerAddress = (address || '').trim() || '—';

    // Blocked check (Phone or IP)
    const checkValue = customerPhone.trim();
    if (checkValue !== '—' && checkValue.length > 0) {
      const cleanPhoneForBlockMatch = (phoneStr: string): string => {
        const cleaned = phoneStr.replace(/\D/g, '');
        return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
      };
      const blockMatchPhone = cleanPhoneForBlockMatch(checkValue);

      const isBlocked = await prisma.blockedItem.findFirst({
        where: {
          OR: [
            blockMatchPhone.length >= 10 ? { type: 'phone', value: { endsWith: blockMatchPhone } } : undefined,
            ip !== 'unknown' ? { type: 'ip', value: ip } : undefined,
          ].filter(Boolean) as any,
        },
      });

      if (isBlocked) {
        return NextResponse.json({ error: 'Blocked' }, { status: 403 });
      }
    } else if (ip !== 'unknown') {
      const isBlockedIp = await prisma.blockedItem.findUnique({
        where: { value: ip },
      });
      if (isBlockedIp) {
        return NextResponse.json({ error: 'Blocked' }, { status: 403 });
      }
    }

    const itemsData = (items as any[]).map(item => ({
      product_id: String(item.id || item.productId || 'unknown'),
      product_name: String(item.name || 'Unknown Product'),
      price: parsePrice(item.price),
      quantity: Math.max(1, parseInt(item.quantity) || 1),
      image_url: item.image || null,
      size: item.size || null,
      color: item.color || null,
    }));

    const existing = await prisma.order.findFirst({
      where: { draft_session_id: sessionId, status: 'incomplete' },
      orderBy: { placed_at: 'desc' },
      select: { id: true, order_id: true },
    });

    if (existing) {
      // Update in a transaction: replace items and update fields
      await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { order_id: existing.order_id } });
        await tx.order.update({
          where: { id: existing.id },
          data: {
            customer_name: customerName,
            phone: customerPhone,
            address: customerAddress,
            subtotal,
            shipping: shippingCharge,
            total,
            ip_address: ip !== 'unknown' ? ip : null,
            placed_at: new Date(),
          },
        });
        if (itemsData.length > 0) {
          await tx.orderItem.createMany({
            data: itemsData.map(d => ({ ...d, order_id: existing.order_id })),
          });
        }
      });
      return NextResponse.json({ success: true, id: existing.id });
    }

    // Create new draft order
    const orderId = 'DRAFT-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    const order = await prisma.order.create({
      data: {
        order_id: orderId,
        draft_session_id: sessionId,
        customer_name: customerName,
        phone: customerPhone,
        address: customerAddress,
        subtotal,
        shipping: shippingCharge,
        discount: 0,
        total,
        payment_method: 'cash',
        amount_paid: 0,
        status: 'incomplete',
        ip_address: ip !== 'unknown' ? ip : null,
        items: itemsData.length > 0
          ? { create: itemsData }
          : undefined,
      },
    });
    return NextResponse.json({ success: true, id: order.id });
  } catch (err: any) {
    // Unique constraint race: another concurrent request already created the draft — ignore
    if (err.code === 'P2002') {
      return NextResponse.json({ success: true });
    }
    console.error('[draft order]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove the draft once the real order is placed successfully
export async function DELETE(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ success: true });
    await prisma.order.deleteMany({
      where: { draft_session_id: sessionId, status: 'incomplete' },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
