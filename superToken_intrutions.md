## Session.getSession vs App Router

The SuperTokens Node SDK’s Session.getSession(req,res) is designed for Node/Express-style APIs where req and res are Node’s request/response objects. In the Next 13+ App Router, however, API route handlers receive NextRequest and produce NextResponse (from next/server), which are not the same as Node’s IncomingMessage/ServerResponse. In other words, you cannot call Session.getSession(req,res) directly on a NextRequest/NextResponse. Instead, SuperTokens provides special Next.js App-Directory helpers. Starting in SDK v16.7.0, for App Router SuperTokens added functions like withSession, getSSRSession, and getAppDirRequestHandler
raw.githubusercontent.com
. These are the recommended way to access sessions in App-Directory routes.

In practice, to retrieve a session in an App Router API route you should use the supertokens-node/nextjs helpers. For example:

* Auth endpoints (/app/api/auth/…) should be handled with getAppDirRequestHandler(). This exposes the built-in SuperTokens auth APIs (signin, signout, session refresh, etc.) under your /api/auth path
supertokens.com
.

* Custom protected routes (e.g. /app/api/user/route.ts) should use withSession(). The withSession(request, async (err, session) => {…}) wrapper verifies the session and passes a session container (or undefined if no valid session) into your handler
supertokens.com
supertokens.com
.

Both approaches require that you initialize SuperTokens on the backend (call supertokens.init(…)). In examples this is often done via an ensureSuperTokensInit() helper imported from your config, which calls supertokens.init(backendConfig()) once
supertokens.com
supertokens.com
.

## Code Examples

Example: Auth API route (`/app/api/auth/[[...path]]/route.ts`). Use the built-in handler from `supertokens-node/nextjs`:

```
// app/api/auth/[[...path]]/route.ts
import { getAppDirRequestHandler } from 'supertokens-node/nextjs';
import { NextRequest } from 'next/server';
import { ensureSuperTokensInit } from '../../../config/backend';

ensureSuperTokensInit();              // Initialize SuperTokens once
const handleAuth = getAppDirRequestHandler();

export async function GET(request: NextRequest) {
  const res = await handleAuth(request);
  // (Optional) disable response caching on Vercel
  if (!res.headers.has('Cache-Control')) {
    res.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
  }
  return res;
}
export function POST(request: NextRequest) {
  return handleAuth(request);
}
```

This passes all /api/auth/* calls into the SuperTokens core handlers. See the SuperTokens docs for this pattern
supertokens.com
.

Example: Protected API route (`/app/api/user/route.ts`). Use `withSession()` to guard the route and get the session:
```
// app/api/user/route.ts
import { withSession } from 'supertokens-node/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { ensureSuperTokensInit } from '../../config/backend';

ensureSuperTokensInit();  // Initialize SuperTokens

export function GET(request: NextRequest) {
  return withSession(request, async (err, session) => {
    if (err) {
      // Session verification error (e.g. JWT expired/invalid)
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    if (!session) {
      // No valid session
      return new NextResponse('Authentication required', { status: 401 });
    }
    // At this point, session is guaranteed. You can use it:
    const userId = session.getUserId();
    return NextResponse.json({ userId });
  });
}
```

Here, `withSession(request, async (err, session) => { … })` checks the cookies/tokens in the `NextRequest`, and either yields `session` (a `SessionContainer`) or handles errors. If there is no session, `session` will be `undefined`, allowing you to return a 401. This pattern is shown in the official docs.

# Initialization and Middleware

You must initialize SuperTokens in your backend (typically once per serverless function). In the examples above, `ensureSuperTokensInit()` does this by calling `supertokens.init(...)` with your `backendConfig`. Without this, session APIs will not work.

Optionally, you can also use Next.js middleware to verify sessions for all or certain routes. For example, a `middleware.ts` using `withSession(request, (err, session) => {...})` can inject a user ID header into requests. However, for App Router API route handlers you do not need a middleware if you use withSession() inside each handler as shown. However, for App Router API route handlers you do not need a middleware if you use `withSession()` inside each handler as shown.

## Summary

* `Session.getSession` is not compatible with Next.js App Router’s `NextRequest/NextResponse` objects. Instead, use the Next.js integration helpers from `supertokens-node/nextjs`.

* Use `getAppDirRequestHandler()` for the SuperTokens auth routes under `/app/api/auth/...`

* Use `withSession(request, handler)` in your custom API routes to access the session container

* Always call `supertokens.init(...)` on the backend (via a helper like `ensureSuperTokensInit()`) before handling requests.

These approaches ensure your Next.js 15.x App Router APIs correctly retrieve and validate the SuperTokens session.

Sources: SuperTokens official docs and changelog
raw.githubusercontent.com
supertokens.com
supertokens.com
, which show the Next.js App Router session API patterns.

## Applied in this repo

- Auth routes (`src/app/api/auth/[...supertokens]/route.ts`) already use `getAppDirRequestHandler()`.
- Session retrieval has been updated to App Router helpers:
  - `src/app/api/auth/me/route.ts` now uses `withSession(request, handler)` and returns `{ user: null }` when not authenticated.
  - `src/lib/authServer.ts#getAuthUserFromRequest` now uses `withSession` to return `{ id, phoneNumber } | null` reliably (no undefined).
- Backend is initialized via `src/lib/supertokensConfig.ts`.

Result: API handlers no longer call `Session.getSession` directly with `NextRequest`; undefined session issues are resolved.