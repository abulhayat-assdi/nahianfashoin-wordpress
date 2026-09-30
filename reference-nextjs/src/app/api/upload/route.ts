import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { r2Upload, r2Delete } from "@/lib/r2";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
];

const MAX_FILE_SIZE = 200 * 1024 * 1024;

const EXT_MAP: Record<string, string> = { jpeg: "jpg" };
const SAFE_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm"];

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminRequest(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Invalid session." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file received." }, { status: 400 });

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: "${file.type}". Only JPEG, PNG, WebP, GIF, MP4, and WEBM are allowed.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `File too large: ${sizeMB}MB. Maximum allowed size is 200MB.` },
        { status: 400 }
      );
    }

    const originalExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = SAFE_EXTS.includes(originalExt) ? (EXT_MAP[originalExt] ?? originalExt) : "jpg";
    const key = `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}.${safeExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await r2Upload(buffer, key, file.type);

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminRequest(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Invalid session." }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided." }, { status: 400 });
    }

    await r2Delete(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete upload error:", error);
    return NextResponse.json({ error: "Failed to delete file." }, { status: 500 });
  }
}
