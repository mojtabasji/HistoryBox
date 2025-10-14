import { NextRequest, NextResponse } from 'next/server';
import type { SessionContainer } from 'supertokens-node/recipe/session';
import { withSession } from 'supertokens-node/nextjs';
import SuperTokens from 'supertokens-node';
import '@/lib/supertokensConfig';

export type AuthUser = { id: string; phoneNumber?: string | null };

// Verifies SuperTokens session from an App Router request and returns user info
export async function getAuthUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  try {
    let result: AuthUser | null = null;
    await withSession(req, async (err, session) => {
      if (err || !session) {
        // Not authenticated or verification error
        result = null;
        return NextResponse.next();
      }

      const sess: SessionContainer = session;
      const userId = sess.getUserId();
      const payload = sess.getAccessTokenPayload() as Record<string, unknown>;
      let phoneNumber = typeof payload?.phoneNumber === 'string' ? payload.phoneNumber : null;
      if (!phoneNumber) {
        try {
          const u = await SuperTokens.getUser(userId);
          phoneNumber = (u as { phoneNumber?: string | null } | null)?.phoneNumber ?? null;
        } catch {
          // ignore
        }
      }
      result = { id: userId, phoneNumber };
      return NextResponse.next();
    });
    return result;
  } catch {
    return null;
  }
}
