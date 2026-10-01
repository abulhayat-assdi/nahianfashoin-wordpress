import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { getSteadfastFraudCheck, normalizePhone } from '@/lib/steadfast-fraud';

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { phone, force } = await req.json();
    if (!phone || phone === '—') {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 });
    }

    const cleanedPhone = normalizePhone(phone);
    if (!cleanedPhone) {
      return NextResponse.json({ error: `Invalid phone number format: ${phone}` }, { status: 400 });
    }

    // 1. Local order statistics (all orders whose phone matches the last 10 digits)
    const phoneLast10 = cleanedPhone.slice(-10);
    const localOrders = await prisma.order.findMany({
      where: {
        phone: { contains: phoneLast10 },
        status: { not: 'incomplete' }, // exclude drafts from counts
      },
      select: { status: true },
    });

    const localStats = {
      total: localOrders.length,
      success: localOrders.filter(o => o.status === 'delivered').length,
      cancel: localOrders.filter(o => o.status === 'returned' || o.status === 'cancelled').length,
      pending: localOrders.filter(o => o.status === 'pending' || o.status === 'received' || o.status === 'preparing' || o.status === 'on_way').length,
    };

    // 2. Steadfast fraud check — served from the DB cache unless it is stale.
    //    `force` still respects the global budget and the rate-limit cooldown.
    const lookup = await getSteadfastFraudCheck(cleanedPhone, { force: force === true });

    const steadfast = lookup.stats
      ? lookup.stats
      : lookup.error
        ? { error: lookup.error }
        : null;

    return NextResponse.json({
      success: true,
      local: localStats,
      steadfast,
      steadfast_meta: {
        cached: lookup.cached,
        stale: lookup.stale,
        fetched_at: lookup.fetched_at,
        next_retry_at: lookup.next_retry_at,
      },
    });
  } catch (error: unknown) {
    console.error('Error in check-ratio:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
