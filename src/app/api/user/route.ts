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

export async function GET(req: NextRequest) {
  try {
    const userInfo = await getSessionUser(req);
    if (!userInfo?.id) return NextResponse.json({ user: null });
    const user = await prisma.user.findUnique({ where: { username: userInfo.id as string }, select: { coins: true, id: true, username: true } });
    return NextResponse.json({ user: { id: userInfo.id, coins: user?.coins ?? 0 } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch user';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
