import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const limit = Math.min(Number(searchParams.get('limit') || '5'), 10);

  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }

  try {
    const email = process.env.NOMINATIM_EMAIL || 'contact@historybox.local';
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(q)}`,
      {
        headers: {
          // Nominatim requires a valid identifying header
          'User-Agent': `history_box/1.0 (${email})`,
          'Accept': 'application/json',
        },
        // Set a conservative timeout via AbortController if needed in future
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: 'Geocoding failed', detail: text }), {
        status: 502,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
    }

    const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string; boundingbox?: [string, string, string, string]; importance?: number; type?: string; }>;
    const results = data.map((r) => ({
      display_name: r.display_name as string,
      lat: parseFloat(r.lat as string),
      lon: parseFloat(r.lon as string),
      boundingbox: r.boundingbox,
      importance: r.importance,
      type: r.type,
    }));

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        // Cache a bit to help rate limits (client can set no-store if needed)
        'cache-control': 'public, max-age=300',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: 'Geocoding error', detail: msg }), {
      status: 500,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
}
