import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { findOrCreateRegion } from '@/lib/geohash';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getAuthedUser(req: NextRequest) {
  const meUrl = new URL('/api/auth/me', req.url);
  const meRes = await fetch(meUrl.toString(), {
    headers: { cookie: req.headers.get('cookie') ?? '' },
    cache: 'no-store',
  });
  if (!meRes.ok) return null;
  const { user } = await meRes.json();
  return user as { email?: string } | null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth0User = await getAuthedUser(req);
    if (!auth0User?.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: auth0User.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const post = await prisma.post.findFirst({ where: { id, userId: user.id } });
    if (!post) return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    return NextResponse.json({ memory: post });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch memory';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth0User = await getAuthedUser(req);
    if (!auth0User?.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: auth0User.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await prisma.post.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: 'Memory not found' }, { status: 404 });

    const body = await req.json();
    const {
      title,
      description,
      caption,
      imageUrl,
      latitude,
      longitude,
      address,
      date,
    } = body as Partial<{ title: string; description: string; caption: string; imageUrl: string; latitude: number; longitude: number; address: string; date: string }>;

    // Optional date parse
    let memoryDate: Date | undefined;
    if (typeof date === 'string' && date) {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      memoryDate = d;
    }

    // Handle region change if lat/lon changed
    let regionId = existing.regionId;
    let regionHash: string | undefined;
    const latChanged = typeof latitude === 'number' && latitude !== existing.latitude;
    const lonChanged = typeof longitude === 'number' && longitude !== existing.longitude;
    if (latChanged || lonChanged) {
      const newLat = typeof latitude === 'number' ? latitude : existing.latitude;
      const newLon = typeof longitude === 'number' ? longitude : existing.longitude;
      const region = await findOrCreateRegion(newLat, newLon, prisma);
      regionId = region.id;
  regionHash = 'geohash' in region ? (region as { geohash: string }).geohash : (region as unknown as { geohash: string }).geohash;
    }

    const updated = await prisma.post.update({
      where: { id: existing.id },
      data: {
        title: typeof title === 'string' ? title : undefined,
        description: typeof description === 'string' ? description : undefined,
        caption: typeof caption === 'string' ? caption : undefined,
        imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
        latitude: typeof latitude === 'number' ? latitude : undefined,
        longitude: typeof longitude === 'number' ? longitude : undefined,
        address: typeof address === 'string' ? address : undefined,
        memoryDate,
        regionId,
        ...(regionHash ? { regionHash } : {}),
      },
    });

    // If region changed, adjust postCount for old/new regions
    if (regionId !== existing.regionId) {
      await prisma.region.update({ where: { id: existing.regionId }, data: { postCount: { decrement: 1 } } });
      await prisma.region.update({ where: { id: regionId }, data: { postCount: { increment: 1 } } });
    }

    return NextResponse.json({ memory: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update memory';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth0User = await getAuthedUser(req);
    if (!auth0User?.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: auth0User.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const id = Number(params.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await prisma.post.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: 'Memory not found' }, { status: 404 });

    await prisma.post.delete({ where: { id } });
    await prisma.region.update({ where: { id: existing.regionId }, data: { postCount: { decrement: 1 } } });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to delete memory';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
