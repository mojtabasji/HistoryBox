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

type Params = { hash: string };
function isPromise<T>(val: unknown): val is Promise<T> {
  return !!val && typeof val === 'object' && 'then' in (val as object) && typeof (val as Promise<unknown>).then === 'function';
}
export async function GET(req: NextRequest, ctx: { params: Promise<Params> | Params }) {
  try {
    const p: Params = isPromise<Params>(ctx.params) ? await ctx.params : (ctx.params as Params);
    const { hash } = p;
    if (!hash) return NextResponse.json({ error: 'Region hash required' }, { status: 400 });

    const region = await prisma.region.findFirst({ where: { OR: [{ geohash: hash }, { hash }] } });
    if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 });

    const authUser = await getSessionUser(req);

    let unlockedCount = 0;
    let isUnlocked = false;
    if (authUser?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: authUser.email } });
      if (dbUser) {
        const unlock = await prisma.userRegionUnlock.findUnique({ where: { userId_regionId: { userId: dbUser.id, regionId: region.id } } });
        if (unlock) {
          isUnlocked = true;
          unlockedCount = unlock.unlockedCount;
        }
      }
    }

    // Fetch posts newest first
    const posts = await prisma.post.findMany({
      where: { regionId: region.id },
      orderBy: { createdAt: 'desc' },
      take: isUnlocked ? Math.max(10, unlockedCount) : 10,
      select: { id: true, caption: true, description: true, imageUrl: true, createdAt: true, latitude: true, longitude: true }
    });

    if (!isUnlocked) {
      // Return teaser data: blur flag and truncated description
      const teaser = posts.map(p => ({
        id: p.id,
        imageUrl: p.imageUrl,
        caption: 'Locked',
        description: truncateWords(p.description || p.caption || 'Hidden memory', 5) + ' …locked',
        blurred: true,
        createdAt: p.createdAt,
      }));
      return NextResponse.json({
        region: { id: region.id, hash: region.hash ?? region.geohash, postCount: region.postCount },
        unlocked: false,
        posts: teaser,
        canUnlock: !!authUser,
      });
    }

    return NextResponse.json({
      region: { id: region.id, hash: region.hash ?? region.geohash, postCount: region.postCount },
      unlocked: true,
      posts,
      canUnlock: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load posts';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function truncateWords(text: string, n: number) {
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length <= n) return text;
  return parts.slice(0, n).join(' ');
}
