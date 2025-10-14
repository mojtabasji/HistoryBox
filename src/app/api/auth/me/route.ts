import { NextRequest, NextResponse } from 'next/server';
import { withSession } from 'supertokens-node/nextjs';
import '@/lib/supertokensConfig';

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
      const payload = session.getAccessTokenPayload() as Record<string, unknown>;
      const phoneNumber = typeof payload?.phoneNumber === 'string' ? payload.phoneNumber : null;
      res = NextResponse.json({ user: { id: userId, phoneNumber } }, { status: 200 });
      return res;
    });
    return res ?? NextResponse.json({ user: null }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
