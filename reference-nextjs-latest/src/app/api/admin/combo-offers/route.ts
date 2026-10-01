import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { r2Delete } from "@/lib/r2";

async function checkAuth(req: NextRequest) {
  const ok = await verifyAdminRequest(req);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(req: NextRequest) {
  const err = await checkAuth(req);
  if (err) return err;

  try {
    const offers = await (prisma as any).comboOffer.findMany({
      orderBy: { display_order: "asc" },
    });
    return NextResponse.json({ data: offers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch combo offers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const err = await checkAuth(req);
  if (err) return err;

  try {
    const body = await req.json();
    const offer = await (prisma as any).comboOffer.create({ data: body });
    revalidatePath('/');
    return NextResponse.json({ data: offer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create combo offer" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const err = await checkAuth(req);
  if (err) return err;

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const old = await (prisma as any).comboOffer.findUnique({ where: { id }, select: { image_url: true, video_url: true } });
    const offer = await (prisma as any).comboOffer.update({ where: { id }, data });

    // Delete replaced image or video
    if (old?.image_url && data.image_url !== undefined && old.image_url !== data.image_url) {
      await r2Delete(old.image_url);
    }
    if (old?.video_url && data.video_url !== undefined && old.video_url !== data.video_url) {
      await r2Delete(old.video_url);
    }

    revalidatePath('/');
    return NextResponse.json({ data: offer });
  } catch {
    return NextResponse.json({ error: "Failed to update combo offer" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const err = await checkAuth(req);
  if (err) return err;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const old = await (prisma as any).comboOffer.findUnique({ where: { id }, select: { image_url: true, video_url: true } });
    await (prisma as any).comboOffer.delete({ where: { id } });

    // Delete associated media from R2
    if (old?.image_url) await r2Delete(old.image_url);
    if (old?.video_url) await r2Delete(old.video_url);

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete combo offer" }, { status: 500 });
  }
}
