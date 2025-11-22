import { NextRequest, NextResponse } from 'next/server';
import { withSession } from 'supertokens-node/nextjs';
import '@/lib/supertokensConfig';
import Passwordless from 'supertokens-node/recipe/passwordless';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let res: NextResponse | null = null;
    await withSession(req, async (err, session) => {
      if (err || !session) {
        res = NextResponse.json({ user: null }, { status: 200 });
        return res;
      }
      const userId = session.getUserId();
      let phoneNumber: string | null = null;

      try {
        // typings for the passwordless recipe may not expose getUserById; assert a minimal interface safely without using any
        const stUser = await (Passwordless as unknown as { getUserById(id: string): Promise<{ phoneNumbers?: string[] } | null> }).getUserById(userId);
        if (stUser && Array.isArray(stUser.phoneNumbers) && stUser.phoneNumbers.length > 0) {
          phoneNumber = stUser.phoneNumbers[0] ?? null;
        }
      } catch {
        // swallow; will fallback to prisma
      }

      if (!phoneNumber) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { username: userId }, select: { phoneNumber: true } });
          phoneNumber = dbUser?.phoneNumber ?? null;
        } catch {
          phoneNumber = null;
        }
      }

      res = NextResponse.json({ user: { id: userId, phoneNumber } }, { status: 200 });
      return res;
    });
    return res ?? NextResponse.json({ user: null }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
