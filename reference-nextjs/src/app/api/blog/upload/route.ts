import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { r2Upload, r2Delete, r2List } from "@/lib/r2";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const BLOG_PREFIX = "blog/";

function safeName(input: string, originalExt: string): string | null {
  const base = input.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/\.{2,}/g, "_");
  if (!base) return null;
  const name = base.toLowerCase().endsWith(`.${originalExt.toLowerCase()}`)
    ? base
    : `${base}.${originalExt}`;
  if (name.includes("/") || name.includes("\\")) return null;
  return name;
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const customName = formData.get("name") as string;

    if (!file || !customName) {
      return NextResponse.json({ error: "File and name are required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: "${file.type}". Only JPEG, PNG, WebP, GIF, and SVG are allowed.` },
        { status: 400 }
      );
    }

    const originalExt = file.name.split(".").pop()?.toLowerCase() || "";
    const filename = safeName(customName, originalExt);
    if (!filename) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const key = `${BLOG_PREFIX}${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await r2Upload(buffer, key, file.type);

    return NextResponse.json({ url, name: filename });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const files = await r2List(BLOG_PREFIX);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    await r2Delete(url);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
