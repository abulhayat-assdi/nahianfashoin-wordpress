import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function verifyAdminRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('nahian-admin')?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  if (!payload) return false;
  return payload.role === 'admin' || payload.role === 'super_admin';
}

export async function getAdminUser(req: NextRequest) {
  const token = req.cookies.get('nahian-admin')?.value;
  if (!token) return null;
  return verifyToken(token);
}
