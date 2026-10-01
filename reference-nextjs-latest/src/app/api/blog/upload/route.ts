import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { r2Upload, r2Delete, r2List } from '@/lib/r2';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const FOLDER = 'blog/';

function sanitizeFilename(name: string, ext: string): string | null {
  const clean = name.replace(/[^a-zA-Z0-9.\-_]/g, '_').replace(/\.{2,}/g, '_');
  if (!clean) return null;
  const withExt = clean.toLowerCase().endsWith(`.${ext.toLowerCase()}`) ? clean : `${clean}.${ext}`;
  return withExt.includes('/') || withExt.includes('\\') ? null : withExt;
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    if (!file || !name) return NextResponse.json({ error: 'File and name are required' }, { status: 400 });
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type: "${file.type}". Only JPEG, PNG, WebP, and GIF are allowed.` }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json({ error: `ইমেজ সাইজ অনেক বড় (${sizeMB}MB)। সর্বোচ্চ ২০MB পর্যন্ত আপলোড করা যাবে। সাইজ কমিয়ে আবার চেষ্টা করুন।` }, { status: 400 });
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const filename = sanitizeFilename(name, ext);
    if (!filename) return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    const key = `${FOLDER}${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await r2Upload(buffer, key, file.type);
    return NextResponse.json({ url, name: filename });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const files = await r2List(FOLDER);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    await r2Delete(url);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
