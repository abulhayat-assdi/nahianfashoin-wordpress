import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('surma-admin')?.value;
  if (!token) return NextResponse.json({ user: null });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      app_metadata: { role: payload.role },
    },
  });
}
