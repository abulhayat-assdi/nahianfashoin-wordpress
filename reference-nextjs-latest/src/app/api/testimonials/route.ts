import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 300;

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { display_order: "asc" },
    });
    return NextResponse.json({ data: testimonials });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
