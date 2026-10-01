// Replaces the Next.js server actions of the "Manage Admins" page with REST calls.
export async function setAdminRole(userId: string, role: 'admin' | 'super_admin' | 'customer'): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || 'Failed to update role' };
    return { success: true };
  } catch (e: any) {
    return { error: e?.message || 'Failed to update role' };
  }
}
