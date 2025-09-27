import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	// Validate required Auth0 env vars to prevent SDK throwing cryptic errors on Edge
	const missing: string[] = [];
	if (!process.env.AUTH0_SECRET) missing.push('AUTH0_SECRET');
	if (!process.env.AUTH0_ISSUER_BASE_URL) missing.push('AUTH0_ISSUER_BASE_URL');
	if (!process.env.AUTH0_BASE_URL && !process.env.NEXT_PUBLIC_AUTH0_BASE_URL) missing.push('AUTH0_BASE_URL');
	if (!process.env.AUTH0_CLIENT_ID) missing.push('AUTH0_CLIENT_ID');
	if (!process.env.AUTH0_CLIENT_SECRET) missing.push('AUTH0_CLIENT_SECRET');
	if (missing.length) {
		return new Response(JSON.stringify({
			error: 'Auth0 is not configured',
			missing,
			hint: 'Set the required environment variables in .env.local and restart the server.'
		}), { status: 500, headers: { 'content-type': 'application/json' } });
	}

	// Pass the request and a NextResponse to avoid Next 15 sync cookies() usage inside the SDK
	const res = new NextResponse();
	const session = await getSession(req, res);
	return new Response(JSON.stringify({ user: session?.user ?? null }), {
		headers: { 'content-type': 'application/json' },
		status: 200,
	});
}
