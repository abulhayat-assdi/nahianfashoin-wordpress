import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return NextResponse.json({ error: `ইমেজ সাইজ অনেক বড় (${sizeMB}MB)। সর্বোচ্চ ২০MB পর্যন্ত আপলোড করা যাবে। সাইজ কমিয়ে আবার চেষ্টা করুন।` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = join(process.cwd(), 'public', 'uploads');

  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Save to uploads/site-logo.png — persists via Docker volume across rebuilds
  await writeFile(join(uploadsDir, 'site-logo.png'), buffer);

  // Save to public/logo.png — immediately served to all pages
  await writeFile(join(process.cwd(), 'public', 'logo.png'), buffer);

  // Save version timestamp — used by favicon, header, and sidebar for cache-busting
  const version = Date.now();
  await writeFile(join(uploadsDir, 'logo-version.json'), JSON.stringify({ v: version }));

  return NextResponse.json({ success: true, v: version });
}
