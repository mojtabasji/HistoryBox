// SuperTokens Core reachability check.
// Used by GET /test (src/app/test/route.ts) to prove the connection URI is reachable
// AND that the exact call the SDK makes first (GET /apiversion) succeeds — a reverse
// proxy or WAF in front of the core can allow "/" while blocking "/apiversion", which
// surfaces in the app as "Error: No SuperTokens core available to query".
// The CLI equivalent lives in scripts/test-supertokens-core.js (plain Node, runs before Next.js builds).

// Same fallback as src/lib/supertokensConfig.ts so we check the URI the app actually uses.
const DEFAULT_CONNECTION_URI = 'https://auth.bytecraft.ir';
const DEFAULT_TIMEOUT_MS = 5000;

export type ProbeErrorCode = 'CORE_UNREACHABLE' | 'UNEXPECTED_RESPONSE' | 'REDIRECTED';

export interface ProbeResult {
  ok: boolean;
  /** HTTP status of the probe, or null if the request never completed */
  status: number | null;
  latencyMs: number;
  /** Response body (trimmed, truncated), or null if unreachable */
  body: string | null;
  error?: { code: ProbeErrorCode; message: string };
}

export interface SuperTokensHealthResult {
  ok: boolean;
  /** Total latency of all probes */
  latencyMs: number;
  /** Back-compat fields: the classic `hello` probe on GET / */
  coreStatus: number | null;
  coreBody: string | null;
  error?: { code: ProbeErrorCode; message: string };
  /** Probe 1: GET / — core answers plain "hello" */
  hello: ProbeResult;
  /** Probe 2: GET /apiversion?apiDomain=...&websiteDomain=... — the SDK's first call */
  sdkApiVersion: ProbeResult & { versions: string[] | null };
  /** What this deployment is actually configured with (host only, never credentials) */
  env: {
    usingDefaultUri: boolean;
    coreHost: string | null;
    apiKeyConfigured: boolean;
  };
}

async function probe(url: string, timeoutMs: number, headers: Record<string, string>, redirect: RequestRedirect): Promise<{ response: Response | null; body: string | null; latencyMs: number; failure?: { code: ProbeErrorCode; message: string } }> {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeoutMs),
      redirect,
      cache: 'no-store',
    });
    const body = (await response.text()).trim().slice(0, 200);
    return { response, body, latencyMs: Date.now() - startedAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      response: null,
      body: null,
      latencyMs: Date.now() - startedAt,
      failure: { code: 'CORE_UNREACHABLE', message: `SuperTokens core unreachable: ${message}` },
    };
  }
}

export async function checkSuperTokensCore(): Promise<SuperTokensHealthResult> {
  const usingDefaultUri = !process.env.SUPERTOKENS_CONNECTION_URI;
  const connectionURI = (
    process.env.SUPERTOKENS_CONNECTION_URI || DEFAULT_CONNECTION_URI
  ).replace(/\/+$/, '');
  const timeoutMs = Number(process.env.SUPERTOKENS_TEST_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  const headers: Record<string, string> = { Accept: 'text/plain, application/json' };
  if (process.env.SUPERTOKENS_API_KEY) headers['api-key'] = process.env.SUPERTOKENS_API_KEY;

  let coreHost: string | null = null;
  try {
    coreHost = new URL(connectionURI).host;
  } catch {
    coreHost = null;
  }

  // Probe 1: classic reachability check — GET / should answer plain "hello"
  const helloRaw = await probe(`${connectionURI}/`, timeoutMs, headers, 'follow');
  const hello: ProbeResult = (() => {
    if (helloRaw.failure) {
      return { ok: false, status: null, latencyMs: helloRaw.latencyMs, body: null, error: helloRaw.failure };
    }
    const status = helloRaw.response!.status;
    if (helloRaw.response!.ok && /\bhello\b/i.test(helloRaw.body ?? '')) {
      return { ok: true, status, latencyMs: helloRaw.latencyMs, body: helloRaw.body };
    }
    return {
      ok: false,
      status,
      latencyMs: helloRaw.latencyMs,
      body: helloRaw.body,
      error: {
        code: 'UNEXPECTED_RESPONSE',
        message: 'Expected a 2xx response with a plain "hello" body from the SuperTokens core',
      },
    };
  })();

  // Probe 2: mirror the SDK's first core call (see supertokens-node querier.getAPIVersion):
  // GET /apiversion?apiDomain=...&websiteDomain=... with redirect: "manual" and the api-key header.
  // The app's own domains are sent exactly as supertokensConfig.ts would send them.
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || 'http://localhost:3000';
  const websiteDomain = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || 'http://localhost:3000';
  const apiversionUrl =
    `${connectionURI}/apiversion?` +
    new URLSearchParams({ apiDomain, websiteDomain }).toString();
  const sdkRaw = await probe(apiversionUrl, timeoutMs, headers, 'manual');
  const sdkApiVersion: SuperTokensHealthResult['sdkApiVersion'] = (() => {
    if (sdkRaw.failure) {
      return {
        ok: false,
        status: null,
        latencyMs: sdkRaw.latencyMs,
        body: null,
        versions: null,
        error: sdkRaw.failure,
      };
    }
    const status = sdkRaw.response!.status;
    if (status >= 300 && status < 400) {
      return {
        ok: false,
        status,
        latencyMs: sdkRaw.latencyMs,
        body: sdkRaw.body,
        versions: null,
        error: {
          code: 'REDIRECTED',
          message:
            'Core redirected the /apiversion call. The SDK uses redirect: "manual" and treats any redirect as a failure — check trailing slashes / http->https redirects on the core proxy',
        },
      };
    }
    let versions: string[] | null = null;
    try {
      const parsed: unknown = JSON.parse(sdkRaw.body ?? '');
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { versions?: unknown }).versions)) {
        versions = (parsed as { versions: unknown[] }).versions.map(String);
      }
    } catch {
      // fall through — handled below
    }
    if (sdkRaw.response!.ok && versions && versions.length > 0) {
      return { ok: true, status, latencyMs: sdkRaw.latencyMs, body: sdkRaw.body, versions };
    }
    return {
      ok: false,
      status,
      latencyMs: sdkRaw.latencyMs,
      body: sdkRaw.body,
      versions,
      error: {
        code: 'UNEXPECTED_RESPONSE',
        message: 'Expected 200 with a JSON body containing "versions" from GET /apiversion',
      },
    };
  })();

  return {
    ok: hello.ok && sdkApiVersion.ok,
    latencyMs: hello.latencyMs + sdkApiVersion.latencyMs,
    coreStatus: hello.status,
    coreBody: hello.body,
    ...(hello.error ? { error: hello.error } : {}),
    hello,
    sdkApiVersion,
    env: { usingDefaultUri, coreHost, apiKeyConfigured: Boolean(process.env.SUPERTOKENS_API_KEY) },
  };
}
