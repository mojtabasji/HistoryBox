import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidAdminApiKey } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function unauthorized() {
  // Use 403 so SuperTokens session interceptors don't treat this as
  // an expired session and auto-refresh/retry in a loop.
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

function ensureAdmin(req: NextRequest) {
  const header = req.headers.get('authorization');
  if (!isValidAdminApiKey(header)) {
    throw unauthorized();
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function resolveRegionId(regionHash?: string | null): Promise<number | null> {
  if (!regionHash) return null;
  const region = await prisma.region.findFirst({
    where: {
      OR: [{ hash: regionHash }, { geohash: regionHash }],
    },
  });
  return region ? region.id : null;
}

export async function GET(req: NextRequest) {
  try {
    ensureAdmin(req);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const posts = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ posts });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to list blog posts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureAdmin(req);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = await req.json();
    const {
      title,
      slug,
      body: content,
      coverImageUrl,
      regionHash,
      regionId,
      latitude,
      longitude,
    } = body as {
      title?: string;
      slug?: string;
      body?: string;
      coverImageUrl?: string | null;
      regionHash?: string | null;
      regionId?: number | null;
      latitude?: number | null;
      longitude?: number | null;
    };

    if (!title || !content) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }

    let finalSlug = slug?.trim();
    if (!finalSlug) finalSlug = slugify(title);

    const resolvedRegionId = typeof regionId === 'number'
      ? regionId
      : await resolveRegionId(regionHash ?? undefined);

    const created = await prisma.blog.create({
      data: {
        title,
        slug: finalSlug,
        body: content,
        coverImageUrl: coverImageUrl ?? null,
        regionId: resolvedRegionId ?? undefined,
      },
    });

    return NextResponse.json({ post: created }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Unique constraint failed') && e.message.includes('Blog_slug')) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    const message = e instanceof Error ? e.message : 'Failed to create blog post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
