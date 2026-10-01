import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const orders = await prisma.order.findMany({
    orderBy: { placed_at: 'desc' },
    include: { items: true },
  });

  // Pre-calculate statistics by phone number
  const cleanPhoneForMatch = (phoneStr: string): string => {
    const cleaned = phoneStr.replace(/\D/g, '');
    return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
  };

  const statsMap = new Map<string, { total: number; success: number; cancel: number }>();

  for (const o of orders) {
    if (o.status === 'incomplete') continue; // exclude drafts from stats
    const key = cleanPhoneForMatch(o.phone);
    if (!key) continue;

    const current = statsMap.get(key) || { total: 0, success: 0, cancel: 0 };
    current.total += 1;
    if (o.status === 'delivered') {
      current.success += 1;
    } else if (o.status === 'returned' || o.status === 'cancelled') {
      current.cancel += 1;
    }
    statsMap.set(key, current);
  }

  const completedPhones = new Set(statsMap.keys());

  // Filter out incomplete orders of customers who completed checkout later
  const filteredOrders = orders.filter(o => {
    if (o.status === 'incomplete') {
      if (!o.phone || o.phone === '—') return true;
      const p = cleanPhoneForMatch(o.phone);
      return p.length === 0 || !completedPhones.has(p);
    }
    return true;
  });

  // Map orders to include local_stats in the payload (representing past history)
  const ordersWithStats = filteredOrders.map(o => {
    const key = cleanPhoneForMatch(o.phone);
    const stats = statsMap.get(key) || { total: 0, success: 0, cancel: 0 };

    // Deduct current order to get PAST history
    let pastTotal = stats.total;
    let pastSuccess = stats.success;
    let pastCancel = stats.cancel;

    if (o.status !== 'incomplete') {
      pastTotal = Math.max(0, pastTotal - 1);
      if (o.status === 'delivered') {
        pastSuccess = Math.max(0, pastSuccess - 1);
      } else if (o.status === 'returned' || o.status === 'cancelled') {
        pastCancel = Math.max(0, pastCancel - 1);
      }
    }

    return {
      ...o,
      local_stats: {
        total: pastTotal,
        success: pastSuccess,
        cancel: pastCancel,
      },
    };
  });

  return NextResponse.json({ data: ordersWithStats });
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id, items, ...data } = await req.json();

    const updateData: any = { ...data };
    if (updateData.subtotal !== undefined) updateData.subtotal = Number(updateData.subtotal);
    if (updateData.shipping !== undefined) updateData.shipping = Number(updateData.shipping);
    if (updateData.discount !== undefined) updateData.discount = Number(updateData.discount);
    if (updateData.total !== undefined) updateData.total = Number(updateData.total);

    const result = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: updateData,
      });

      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.id) {
            await tx.orderItem.update({
              where: { id: item.id },
              data: {
                size: item.size,
                price: item.price !== undefined ? Number(item.price) : undefined,
                quantity: item.quantity !== undefined ? parseInt(item.quantity) : undefined,
              },
            });
          }
        }
      }

      return tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    console.error('Error updating order:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await req.json();
    // Delete order items first (cascade should handle it, but being explicit)
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
