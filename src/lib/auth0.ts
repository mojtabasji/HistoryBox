import { getSession } from '@auth0/nextjs-auth0';

export async function requireAuth() {
  const session = await getSession();
  if (!session || !session.user) {
    return { user: null } as const;
  }
  return { user: session.user } as const;
}
