export type PlanId = 'starter' | 'lite' | 'standard' | 'pro' | 'mega';

export const PLAN_MAP: Record<PlanId, { coins: number; priceIrr: number }> = {
  starter: { coins: 10, priceIrr: 99000 },
  lite: { coins: 50, priceIrr: 249000 },
  standard: { coins: 120, priceIrr: 499000 },
  pro: { coins: 300, priceIrr: 990000 },
  mega: { coins: 700, priceIrr: 1990000 },
};

export function isValidPlan(planId: string): planId is PlanId {
  return Object.prototype.hasOwnProperty.call(PLAN_MAP, planId);
}

export function generateOrderId(planId: PlanId): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `hb_${planId}_${ts}_${rand}`;
}

export function extractPlanIdFromOrderOrDescription(orderId?: string | null, description?: string | null): PlanId | null {
  if (orderId && orderId.startsWith('hb_')) {
    const parts = orderId.split('_');
    if (parts.length >= 3) {
      const maybe = parts[1];
      if (isValidPlan(maybe)) return maybe;
    }
  }
  if (description) {
    // Expecting formats like "starter: 10 coins" or "plan:starter" if customized later
    const desc = description.toLowerCase();
    for (const pid of Object.keys(PLAN_MAP) as PlanId[]) {
      if (desc.includes(pid)) return pid;
    }
  }
  return null;
}
