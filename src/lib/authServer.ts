import { NextRequest } from 'next/server';
import Session from 'supertokens-node/recipe/session';
import { superTokensNextWrapper } from 'supertokens-node/nextjs';
import '@/lib/supertokensConfig';

export type AuthUser = { id: string; phoneNumber?: string | null };

// Verifies SuperTokens session from an App Router request and returns user info
export async function getAuthUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  try {
    let userSession: import('supertokens-node/recipe/session').SessionContainer | undefined;
    await superTokensNextWrapper(async () => {
      userSession = await Session.getSession(req, { sessionRequired: false });
    }, req, {}); // Pass an empty object as the response if you don't have one
    if (!userSession) return null;
    const userId = userSession.getUserId();
    const payload = userSession.getAccessTokenPayload() as Record<string, unknown>;
  const phoneNumber = typeof payload?.phoneNumber === 'string' ? payload.phoneNumber : null;
    return { id: userId, phoneNumber };
  } catch {
    return null;
  }
}
