import { handleAuth } from '@auth0/nextjs-auth0';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Next 15: params is a Promise; await it before use
type Auth0RouteContext = { params: { auth0: string[] } };

type NextAuthHandler = (req: Request, ctx: Auth0RouteContext) => Promise<Response>;
const authHandler = handleAuth() as unknown as NextAuthHandler;

export async function GET(req: Request, ctx: { params: Promise<{ auth0: string[] }> }) {
	const awaitedParams = await ctx.params;
	const handlerCtx: Auth0RouteContext = { params: awaitedParams };
	return (authHandler as unknown as (req: Request, ctx: Auth0RouteContext) => Promise<Response>)(req, handlerCtx);
}

export async function POST(req: Request, ctx: { params: Promise<{ auth0: string[] }> }) {
	const awaitedParams = await ctx.params;
	const handlerCtx: Auth0RouteContext = { params: awaitedParams };
	return authHandler(req, handlerCtx);
}
