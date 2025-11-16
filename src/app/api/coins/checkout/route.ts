import { NextRequest, NextResponse } from 'next/server';
import { getPaymentConfig } from '@/lib/config';
import { PLAN_MAP, isValidPlan, generateOrderId, type PlanId } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { planId } = (await req.json()) as { planId?: string };
    if (!planId || !isValidPlan(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const { baseUrl, apiKey, serviceId, callbackUrl } = getPaymentConfig();
    if (!apiKey) {
      return NextResponse.json({ error: 'Payment API not configured' }, { status: 500 });
    }

    const plan = PLAN_MAP[planId as PlanId];
    const order_id = generateOrderId(planId as PlanId);

    const body: Record<string, unknown> = {
      service_id: serviceId,
      order_id,
      amount: plan.priceIrr,
      currency: 'IRR',
      description: `${planId}: ${plan.coins} coins`,
    };
    if (callbackUrl) {
      body['callback_url'] = callbackUrl;
    }

    const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/api/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      // Ensure server-to-server, do not cache
      cache: 'no-store',
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      const message = (err as any)?.error || `Payment service error (${resp.status})`;
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = (await resp.json()) as { payment_url?: string };
    if (!data?.payment_url) {
      return NextResponse.json({ error: 'Missing payment_url from service' }, { status: 502 });
    }

    return NextResponse.json({ url: data.payment_url, order_id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to start checkout';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
