import { NextRequest, NextResponse } from 'next/server';
import Session from 'supertokens-node/recipe/session';
import type { SessionContainer } from 'supertokens-node/recipe/session';
import { superTokensNextWrapper } from 'supertokens-node/nextjs';
import SuperTokens from 'supertokens-node';
import '@/lib/supertokensConfig';

export type AuthUser = { id: string; phoneNumber?: string | null };

// Verifies SuperTokens session from an App Router request and returns user info
export async function getAuthUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  try {
    let userSession: SessionContainer | null = null;
    await superTokensNextWrapper(async () => {
      userSession = await Session.getSession(req, { sessionRequired: false });
    }, req, NextResponse.next());
  if (!userSession) return null;
  const sess: SessionContainer = userSession!;
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
    return { id: userId, phoneNumber };
  } catch {
    return null;
  }
}
