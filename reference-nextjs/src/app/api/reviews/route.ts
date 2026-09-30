import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  // 5 reviews per hour per IP to prevent spam
  if (!checkRateLimit(`review:${ip}`, 5, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: 'Too many reviews submitted. Please try again later.' }, { status: 429 });
  }

  const { product_id, name, rating, comment } = await req.json();
  if (!product_id || !name || !rating || !comment) {
    return NextResponse.json({ error: 'product_id, name, rating, and comment are required' }, { status: 400 });
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
  }
  if (typeof name !== 'string' || name.trim().length > 100) {
    return NextResponse.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 });
  }
  if (typeof comment !== 'string' || comment.trim().length > 2000) {
    return NextResponse.json({ error: 'Review must be 2000 characters or fewer' }, { status: 400 });
  }
  try {
    const review = await prisma.productReview.create({
      data: { product_id, name: name.trim(), rating: ratingNum, comment: comment.trim() },
    });
    return NextResponse.json({ success: true, review });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reviewId } = await req.json();
  if (!reviewId) return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });

  try {
    await prisma.productReview.delete({ where: { id: reviewId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reviewId, name, rating, comment } = await req.json();
  if (!reviewId) return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });

  try {
    await prisma.productReview.update({
      where: { id: reviewId },
      data: { name, rating, comment },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
