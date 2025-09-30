import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLAN_MAP: Record<string, { coins: number; priceCents: number }> = {
  starter: { coins: 10, priceCents: 199 },
  lite: { coins: 50, priceCents: 799 },
  standard: { coins: 120, priceCents: 1499 },
  pro: { coins: 300, priceCents: 3499 },
  mega: { coins: 700, priceCents: 6999 },
};

export async function POST(req: NextRequest) {
  try {
    const { planId } = (await req.json()) as { planId?: string };
    if (!planId || !(planId in PLAN_MAP)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    // In a real integration, create a payment session (Stripe/Checkout.com/etc.)
    // For now, redirect back to /coins with a mocked success.
    const url = new URL('/coins', req.url);
    url.searchParams.set('status', 'success');
    url.searchParams.set('plan', planId);
    return NextResponse.json({ url: url.toString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to start checkout';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
