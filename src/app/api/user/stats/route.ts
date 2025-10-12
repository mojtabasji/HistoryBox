import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/authServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const stUser = await getAuthUserFromRequest(req);
    if (!stUser?.id) return NextResponse.json({ coins: 0 }, { status: 200 });
    // Map SuperTokens user to Prisma user: prefer firebaseUid storing external id; fallback by phone (username)
    let user = await prisma.user.findFirst({ where: { firebaseUid: stUser.id } });
    if (!user && stUser.phoneNumber) {
      user = await prisma.user.findFirst({ where: { username: stUser.phoneNumber } });
    }
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
