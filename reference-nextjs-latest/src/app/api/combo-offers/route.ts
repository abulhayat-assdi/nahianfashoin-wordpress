import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 60;

export async function GET() {
  try {
    const offers = await (prisma as any).comboOffer.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
    });
    return NextResponse.json({ data: offers });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
