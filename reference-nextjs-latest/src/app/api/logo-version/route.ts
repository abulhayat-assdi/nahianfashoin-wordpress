import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = await readFile(
      join(process.cwd(), 'public', 'uploads', 'logo-version.json'),
      'utf8'
    );
    const { v } = JSON.parse(content);
    return NextResponse.json({ v }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ v: 1 }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
