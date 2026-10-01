import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

// GET — List all blocked items
export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = await prisma.blockedItem.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error('[BLOCKED_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — Add an item to the blocked list (phone or IP)
export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, value, reason } = await req.json();

    if (!type || !value) {
      return NextResponse.json({ error: 'Type and value are required.' }, { status: 400 });
    }

    if (type !== 'phone' && type !== 'ip') {
      return NextResponse.json({ error: 'Invalid block type. Must be "phone" or "ip".' }, { status: 400 });
    }

    let blockValue = String(value).trim();

    // If it's a phone number, clean/normalize it
    if (type === 'phone') {
      let cleaned = blockValue.replace(/\D/g, '');
      if (cleaned.startsWith('880')) {
        cleaned = cleaned.substring(3);
      } else if (cleaned.startsWith('88')) {
        cleaned = cleaned.substring(2);
      }
      
      if (cleaned.length > 11) {
        cleaned = cleaned.slice(-11);
      }
      if (cleaned.length === 10 && !cleaned.startsWith('0')) {
        cleaned = '0' + cleaned;
      }
      
      if (cleaned.length !== 11 || !cleaned.startsWith('01')) {
        return NextResponse.json({ error: 'Invalid Bangladeshi phone number format.' }, { status: 400 });
      }
      blockValue = cleaned;
    }

    // Check if already blocked
    const existing = await prisma.blockedItem.findUnique({
      where: { value: blockValue },
    });

    if (existing) {
      return NextResponse.json({ error: `This ${type} is already blocked.` }, { status: 400 });
    }

    const item = await prisma.blockedItem.create({
      data: {
        type,
        value: blockValue,
        reason: (reason || '').trim() || 'No reason specified',
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error('[BLOCKED_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — Remove an item from the blocked list (unblock)
export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID required.' }, { status: 400 });
    }

    await prisma.blockedItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[BLOCKED_DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
