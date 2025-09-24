import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

export async function requireAuth(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return { user: null } as const;
  }
  return { user: session.user } as const;
}
