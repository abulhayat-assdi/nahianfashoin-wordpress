import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, revokeJti } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('nahian-admin')?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.jti) revokeJti(payload.jti);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('nahian-admin', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
