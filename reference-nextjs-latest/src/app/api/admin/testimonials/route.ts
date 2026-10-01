import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { r2Delete } from '@/lib/r2';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await prisma.testimonial.findMany({ orderBy: { display_order: 'asc' } });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const data = await prisma.testimonial.create({ data: body });
  revalidatePath('/');
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, ...body } = await req.json();
  const old = await prisma.testimonial.findUnique({ where: { id }, select: { image_url: true, video_url: true } });
  const data = await prisma.testimonial.update({ where: { id }, data: body });
  revalidatePath('/');

  // Delete replaced image or video
  if (old?.image_url && body.image_url !== undefined && old.image_url !== body.image_url) {
    await r2Delete(old.image_url);
  }
  if (old?.video_url && body.video_url !== undefined && old.video_url !== body.video_url) {
    await r2Delete(old.video_url);
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await req.json();
  const testimonial = await prisma.testimonial.findUnique({ where: { id }, select: { image_url: true } });
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath('/');

  if (testimonial?.image_url) await r2Delete(testimonial.image_url);

  return NextResponse.json({ success: true });
}
