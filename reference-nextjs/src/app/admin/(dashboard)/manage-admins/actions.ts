"use server";

import { prisma } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { revalidatePath } from "next/cache";

export async function getAdmins() {
  const caller = await getServerUser('admin');
  if (!caller || (caller.role !== 'admin' && caller.role !== 'super_admin')) {
    throw new Error('Unauthorized');
  }

  const admins = await prisma.customer.findMany({
    where: { role: { in: ['admin', 'super_admin'] } },
    select: { id: true, name: true, email: true, role: true, created_at: true },
    orderBy: { created_at: 'asc' },
  });

  return admins.map(a => ({
    id: a.id,
    name: a.name || '',
    email: a.email || '',
    role: a.role || 'customer',
    created_at: a.created_at.toISOString(),
  }));
}

export async function setAdminRole(userId: string, role: 'admin' | 'super_admin' | 'customer') {
  const caller = await getServerUser('admin');
  if (!caller || caller.role !== 'super_admin') {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.customer.update({
      where: { id: userId },
      data: { role },
    });
    revalidatePath('/admin/manage-admins');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update role';
    console.error("Error setting admin role:", err);
    return { error: message };
  }
}
