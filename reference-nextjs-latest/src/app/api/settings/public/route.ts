import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { whatsapp_number: true },
  });
  return NextResponse.json({ whatsapp_number: settings?.whatsapp_number ?? null });
}
