import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { order_id, invoice, customer_name, customer_phone, customer_address, amount_to_collect, note } = body;

    if (!order_id || !invoice || !customer_name || !customer_phone || !customer_address) {
      return NextResponse.json({ success: false, error: 'Missing required order details' }, { status: 400 });
    }

    // Clean phone number (remove +88 and any non-digit characters)
    let cleanedPhone = customer_phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('880')) {
      cleanedPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.startsWith('88')) {
      cleanedPhone = cleanedPhone.substring(2);
    }

    // Steadfast requires exactly 11 digits (e.g. 017xxxxxxxx)
    if (cleanedPhone.length !== 11) {
      return NextResponse.json({
        success: false,
        error: `Invalid phone number: ${customer_phone}. Steadfast requires an 11-digit number.`,
      }, { status: 400 });
    }

    const steadfastData = {
      invoice,
      recipient_name: customer_name,
      recipient_phone: cleanedPhone,
      recipient_address: customer_address,
      cod_amount: amount_to_collect,
      note: note || '',
    };

    const steadfastResponse = await fetch('https://portal.packzy.com/api/v1/create_order', {
      method: 'POST',
      headers: {
        'Api-Key': process.env.STEADFAST_API_KEY || '',
        'Secret-Key': process.env.STEADFAST_SECRET_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(steadfastData),
    }).catch(err => {
      console.error('Fetch to Steadfast failed:', err);
      throw new Error('Connection to Courier Server failed. Please check your internet or API keys.');
    });

    const result = await steadfastResponse.json();

    if (!steadfastResponse.ok || result.status !== 200) {
      return NextResponse.json({
        success: false,
        error: result?.message || result?.errors?.[0] || 'Courier API error: ' + JSON.stringify(result),
      }, { status: 400 });
    }

    // Extract consignment ID from Steadfast response
    const consignmentId = result?.consignment?.consignment_id
      ? String(result.consignment.consignment_id)
      : null;

    // Success from Steadfast — save consignment_id (status stays as-is; order remains
    // in the New Orders tab until manually marked complete via "Complete Order")
    if (consignmentId) {
      await prisma.order.update({
        where: { id: order_id },
        data: { consignment_id: consignmentId },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Parcel sent to Steadfast successfully!',
      consignment_id: consignmentId,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
