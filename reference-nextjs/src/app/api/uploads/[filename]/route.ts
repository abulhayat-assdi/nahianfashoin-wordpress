import { NextRequest, NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!filename || filename.includes('/') || filename.includes('..')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const filePath = join(process.cwd(), 'public', 'uploads', filename);

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) return new NextResponse('Not found', { status: 404 });

    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

    const stream = createReadStream(filePath);
    const body = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stats.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
