import { handleAuth } from '@auth0/nextjs-auth0';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Export all route handlers for Auth0: login, callback, logout, me
export const GET = handleAuth();
export const POST = handleAuth();
