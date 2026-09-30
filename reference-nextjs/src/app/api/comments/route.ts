import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Blog slug is required' }, { status: 400 });
  }

  const comments = await prisma.blogComment.findMany({
    where: { blog_slug: slug },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  // 5 comments per hour per IP to prevent spam
  if (!checkRateLimit(`comment:${ip}`, 5, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: 'Too many comments submitted. Please try again later.' }, { status: 429 });
  }

  try {
    const { blog_slug, author_name, content } = await req.json();
    if (!blog_slug || !author_name || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof author_name !== 'string' || author_name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 });
    }
    if (typeof content !== 'string' || content.trim().length > 2000) {
      return NextResponse.json({ error: 'Comment must be 2000 characters or fewer' }, { status: 400 });
    }

    const comment = await prisma.blogComment.create({
      data: { blog_slug, author_name: author_name.trim(), content: content.trim() },
    });

    return NextResponse.json({ success: true, comment });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
