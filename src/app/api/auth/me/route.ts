import { NextRequest, NextResponse } from 'next/server';
import Session from 'supertokens-node/recipe/session';
import '@/lib/supertokensConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await Session.getSession(req, { sessionRequired: false });
    if (!session) return NextResponse.json({ user: null }, { status: 200 });
    const userId = session.getUserId();
    const payload = session.getAccessTokenPayload() as Record<string, unknown>;
    const phoneNumber = typeof payload?.phoneNumber === 'string' ? payload.phoneNumber : null;
    return NextResponse.json({ user: { id: userId, phoneNumber } }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
