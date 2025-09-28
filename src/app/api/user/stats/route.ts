import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

export async function GET(req: NextRequest) {
  try {
    const auth0User = await getAuthedUser(req);
    if (!auth0User?.email) return NextResponse.json({ coins: 0 }, { status: 200 });
    const user = await prisma.user.findUnique({ where: { email: auth0User.email } });
    if (!user) return NextResponse.json({ coins: 0 }, { status: 200 });
    // Primary: read coins from the User table (Supabase column)
    let coins: number | null = null;
    try {
      const rows = await prisma.$queryRaw<{ coins: number }[]>`
        SELECT "coins" FROM "User" WHERE "id" = ${user.id} LIMIT 1
      `;
      if (rows.length && typeof rows[0]?.coins === 'number') coins = rows[0].coins;
    } catch {
      // If the column doesn't exist or any error occurs, fall back below
    }

    if (typeof coins !== 'number') {
      // Fallback: derive coins from number of posts to avoid breaking UI
      const count = await prisma.post.count({ where: { userId: user.id } });
      coins = count;
    }

    return NextResponse.json({ coins }, { status: 200 });
  } catch {
    return NextResponse.json({ coins: 0 }, { status: 200 });
  }
}
