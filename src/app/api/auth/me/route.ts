import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	// Pass the request and a NextResponse to avoid Next 15 sync cookies() usage inside the SDK
	const res = new NextResponse();
	const session = await getSession(req, res);
	return new Response(JSON.stringify({ user: session?.user ?? null }), {
		headers: { 'content-type': 'application/json' },
		status: 200,
	});
}
