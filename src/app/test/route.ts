import { NextResponse } from 'next/server';
import { checkSuperTokensCore } from '@/lib/supertokensHealth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /test — SuperTokens core reachability check.
// 200 when the core answers "hello", 503 otherwise.
export async function GET() {
  try {
    const result = await checkSuperTokensCore();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (err) {
    // Never leak stack traces or internals
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json(
      {
        ok: false,
        latencyMs: 0,
        coreStatus: null,
        coreBody: null,
        error: { code: 'CHECK_FAILED', message },
      },
      { status: 500 },
    );
  }
}
