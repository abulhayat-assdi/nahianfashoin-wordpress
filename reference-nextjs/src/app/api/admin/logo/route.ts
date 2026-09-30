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
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 5 MB.' }, { status: 400 });
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

  return NextResponse.json({ success: true });
}
