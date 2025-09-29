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
    if (!userInfo?.email) return NextResponse.json({ user: null });
    const user = await prisma.user.findUnique({ where: { email: userInfo.email as string }, select: { coins: true, email: true, id: true } });
    return NextResponse.json({ user: { email: userInfo.email, coins: user?.coins ?? 0 } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch user';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
