import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getSessionUser(req: NextRequest) {
  try {
    const meUrl = new URL('/api/auth/me', req.url);
    const meRes = await fetch(meUrl.toString(), { headers: { cookie: req.headers.get('cookie') ?? '' }, cache: 'no-store' });
    if (!meRes.ok) return null;
    const data = await meRes.json();
  return data?.user ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
  const userInfo = await getSessionUser(req);
  if (!userInfo) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const regionHash = body?.regionHash as string | undefined;
    if (!regionHash) return NextResponse.json({ error: 'regionHash required' }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { username: userInfo.id as string } });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const region = await prisma.region.findFirst({ where: { OR: [{ geohash: regionHash }, { hash: regionHash }] } });
    if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 });

    // Cost is 2 coins per unlock step (initial or subsequent)
    if ((dbUser.coins ?? 0) < 2) {
      return NextResponse.json({ error: 'Not enough coins' }, { status: 402 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({ where: { id: dbUser.id }, data: { coins: { decrement: 2 } } });
      const existing = await tx.userRegionUnlock.findUnique({
        where: { userId_regionId: { userId: dbUser.id, regionId: region.id } },
        select: { id: true, unlockedCount: true }
      });
      if (existing) {
        const nextCount = existing.unlockedCount + 10;
        const capped = Math.min(nextCount, region.postCount || nextCount);
        const unlock = await tx.userRegionUnlock.update({ where: { id: existing.id }, data: { unlockedCount: capped } });
        return { updatedUser, unlock };
      } else {
        const unlock = await tx.userRegionUnlock.create({ data: { userId: dbUser.id, regionId: region.id, unlockedCount: 10 } });
        return { updatedUser, unlock };
      }
    });

    return NextResponse.json({ ok: true, unlockedCount: result.unlock.unlockedCount, coins: result.updatedUser.coins });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to unlock region';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
