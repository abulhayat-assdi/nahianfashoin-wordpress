import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { order_id: orderId },
    include: { items: true },
  });

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // If the order belongs to a registered user, verify ownership or admin role
  if (order.user_id) {
    const isAdmin = await verifyAdminRequest(req);
    if (!isAdmin) {
      const user = await getServerUser('public');
      if (!user || user.sub !== order.user_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }
  // Guest orders (no user_id) are accessible by order_id alone —
  // the random 10-char ID acts as a secret token for order confirmation.

  // Enrich items with product category for GA4 tracking
  const productIds = order.items.map((item) => item.product_id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, category: true },
  });
  const categoryMap = Object.fromEntries(products.map((p) => [p.id, p.category]));
  const itemsWithCategory = order.items.map((item) => ({
    ...item,
    category: categoryMap[item.product_id] ?? null,
  }));

  return NextResponse.json({ data: { ...order, items: itemsWithCategory } });
}
