import { NextRequest, NextResponse } from 'next/server';
import { getPaymentConfig } from '@/lib/config';
import prisma from '@/lib/prisma';
import { extractPlanIdFromOrderOrDescription, PLAN_MAP, type PlanId } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getSessionUserId(req: NextRequest): Promise<string | null> {
  try {
    const meUrl = new URL('/api/auth/me', req.url);
    const meRes = await fetch(meUrl.toString(), {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });
    if (!meRes.ok) return null;
    const data = (await meRes.json().catch(() => null)) as { user?: { id?: string } } | null;
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

type VerifyPayload = {
  error?: string;
  status?: string;
  order_id?: string;
  description?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ transaction_id?: string }> | { transaction_id?: string } }
) {
  // `ctx.params` may be a promise in Next.js; await it before accessing properties
  const params = await ctx.params;
  const { transaction_id } = params ?? {};
  const { baseUrl } = getPaymentConfig();

  try {
    if (!transaction_id) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    const verifyRes = await fetch(`${baseUrl.replace(/\/$/, '')}/api/verify/${transaction_id}`, {
      method: 'GET',
      cache: 'no-store',
    });

    const payload = (await verifyRes.json().catch(() => ({} as VerifyPayload))) as VerifyPayload;
    if (!verifyRes.ok) {
      const message = payload.error || `Verify failed (${verifyRes.status})`;
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // Expected payload fields (per docs/Postman):
    // amount, currency, description, order_id, service_id, status, transaction_id
    const status = typeof payload.status === 'string' ? payload.status : undefined;
    const orderId = typeof payload.order_id === 'string' ? payload.order_id : undefined;
    const description = typeof payload.description === 'string' ? payload.description : undefined;
    const amount = typeof payload.amount === 'number' ? payload.amount : undefined;
    const currency = typeof payload.currency === 'string' ? payload.currency : undefined;

    if (status !== 'success') {
      return NextResponse.json({ status: 'failed', verify: payload }, { status: 200 });
    }

    // Identify plan by order/description
    const planId = extractPlanIdFromOrderOrDescription(orderId ?? null, description ?? null);

    // Try to credit user if session available
    const sessionUserId = await getSessionUserId(req);
    let credited = false;
    let newBalance: number | null = null;
    let coinsAdded = 0;

    if (sessionUserId && planId) {
      const plan = PLAN_MAP[planId as PlanId];
      coinsAdded = plan.coins;
      // Map session userId (SuperTokens) to prisma User via username
      const user = await prisma.user.findUnique({ where: { username: sessionUserId }, select: { id: true, coins: true } });
      if (user) {
        const updated = await prisma.user.update({ where: { id: user.id }, data: { coins: user.coins + plan.coins }, select: { coins: true } });
        credited = true;
        newBalance = updated.coins;
      }
    }

    return NextResponse.json({
      status: 'success',
      transaction_id,
      order_id: orderId,
      amount,
      currency,
      planId,
      credited,
      coinsAdded,
      newBalance,
      verify: payload,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Verification failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
