import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminUser } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

const ALLOWED_ROLES = ['admin', 'super_admin', 'customer'] as const;

export async function GET(req: NextRequest) {
  const caller = await getAdminUser(req);
  if (!caller || (caller.role !== 'admin' && caller.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admins = await prisma.customer.findMany({
    where: { role: { in: ['admin', 'super_admin'] } },
    select: { id: true, name: true, email: true, role: true, created_at: true },
    orderBy: { created_at: 'asc' },
  });
  return NextResponse.json({ data: admins });
}

export async function PUT(req: NextRequest) {
  const caller = await getAdminUser(req);
  if (!caller || caller.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { userId, role } = await req.json();
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }
  await prisma.customer.update({ where: { id: userId }, data: { role } });
  revalidatePath('/admin/manage-admins');
  return NextResponse.json({ success: true });
}
