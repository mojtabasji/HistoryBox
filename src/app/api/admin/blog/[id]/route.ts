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

async function resolveRegionId(regionHash?: string | null): Promise<number | null> {
  if (!regionHash) return null;
  const region = await prisma.region.findFirst({
    where: {
      OR: [{ hash: regionHash }, { geohash: regionHash }],
    },
  });
  return region ? region.id : null;
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    ensureAdmin(req);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
      tags,
    } = body as {
      title?: string;
      slug?: string;
      body?: string;
      coverImageUrl?: string | null;
      regionHash?: string | null;
      regionId?: number | null;
      latitude?: number | null;
      longitude?: number | null;
      tags?: string[] | string | null;
    };

    let newRegionId: number | null | undefined = undefined;
    if (typeof regionId === 'number') {
      newRegionId = regionId;
    } else if (regionHash !== undefined) {
      newRegionId = await resolveRegionId(regionHash);
    }

    const latValue = typeof latitude === 'number' ? latitude : null;
    const lngValue = typeof longitude === 'number' ? longitude : null;

    let normalizedTags: string[] | undefined;
    if (Array.isArray(tags)) {
      normalizedTags = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      normalizedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const updated = await prisma.blog.update({
      where: { id },
      data: {
        title: title ?? undefined,
        slug: slug ?? undefined,
        body: content ?? undefined,
        coverImageUrl: coverImageUrl ?? undefined,
        regionId: newRegionId === null ? undefined : newRegionId,
        latitude: latValue,
        longitude: lngValue,
        tags: normalizedTags ?? undefined,
      },
    });

    return NextResponse.json({ post: updated });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Unique constraint failed') && e.message.includes('Blog_slug')) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    const message = e instanceof Error ? e.message : 'Failed to update blog post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    ensureAdmin(req);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await prisma.blog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to delete blog post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
