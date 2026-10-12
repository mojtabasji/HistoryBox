// SuperTokens Core reachability check.
// Used by GET /test (src/app/test/route.ts) to prove the connection URI is reachable.
// The CLI equivalent lives in scripts/test-supertokens-core.js (plain Node, runs before Next.js builds).

// Same fallback as src/lib/supertokensConfig.ts so we check the URI the app actually uses.
const DEFAULT_CONNECTION_URI = 'https://auth.bytecraft.ir';
const DEFAULT_TIMEOUT_MS = 5000;

export interface SuperTokensHealthResult {
  ok: boolean;
  latencyMs: number;
  /** HTTP status returned by the core, or null if the request never completed */
  coreStatus: number | null;
  /** Core response body (trimmed, truncated), or null if unreachable */
  coreBody: string | null;
  error?: { code: 'CORE_UNREACHABLE' | 'UNEXPECTED_RESPONSE'; message: string };
}

export async function checkSuperTokensCore(): Promise<SuperTokensHealthResult> {
  const connectionURI = (
    process.env.SUPERTOKENS_CONNECTION_URI || DEFAULT_CONNECTION_URI
  ).replace(/\/+$/, '');
  const timeoutMs = Number(process.env.SUPERTOKENS_TEST_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  const headers: Record<string, string> = { Accept: 'text/plain, application/json' };
  if (process.env.SUPERTOKENS_API_KEY) headers['api-key'] = process.env.SUPERTOKENS_API_KEY;

  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(`${connectionURI}/`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
      cache: 'no-store',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      coreStatus: null,
      coreBody: null,
      error: { code: 'CORE_UNREACHABLE', message: `SuperTokens core unreachable: ${message}` },
    };
  }

  const latencyMs = Date.now() - startedAt;
  const body = (await response.text()).trim();
  const truncatedBody = body.slice(0, 200);

  if (response.ok && /\bhello\b/i.test(body)) {
    return { ok: true, latencyMs, coreStatus: response.status, coreBody: truncatedBody };
  }

  return {
    ok: false,
    latencyMs,
    coreStatus: response.status,
    coreBody: truncatedBody,
    error: {
      code: 'UNEXPECTED_RESPONSE',
      message: 'Expected a 2xx response with a plain "hello" body from the SuperTokens core',
    },
  };
}
