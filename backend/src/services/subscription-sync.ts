import Razorpay from 'razorpay';
import type { PrismaClient, Subscription } from '@prisma/client';
import { config } from '../config.js';

// ── Razorpay Singleton ──

let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    if (!config.razorpay.keyId || !config.razorpay.keySecret) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpayInstance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return razorpayInstance;
}

// ── Anchored FREE Period Calculation ──

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function calculateNextFreePeriod(originalStart: Date): {
  periodStart: Date;
  periodEnd: Date;
} {
  const now = Date.now();
  const startMs = originalStart.getTime();

  // How many full 30-day periods have elapsed since originalStart?
  const elapsed = now - startMs;
  const periodsElapsed = Math.floor(elapsed / PERIOD_MS);

  const periodStart = new Date(startMs + periodsElapsed * PERIOD_MS);
  const periodEnd = new Date(periodStart.getTime() + PERIOD_MS);

  return { periodStart, periodEnd };
}

// ── Downgrade to FREE ──

export async function downgradeToFree(
  prisma: PrismaClient,
  subscription: Subscription,
): Promise<void> {
  const freePlan = await prisma.productPlan.findFirst({
    where: { productId: subscription.productId, plan: 'FREE' },
  });

  const { periodStart, periodEnd } = calculateNextFreePeriod(
    subscription.createdAt,
  );

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: 'FREE',
      status: 'ACTIVE',
      usageLimit: freePlan?.usageLimit ?? 5,
      usageCount: 0,
      razorpaySubscriptionId: null,
      cancelAtPeriodEnd: false,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });
}

// ── Sync with Razorpay ──

export type SyncResult =
  | 'renewed'      // Razorpay active + newer period → updated locally
  | 'downgraded'   // Razorpay cancelled/completed/expired → moved to FREE
  | 'halted'       // Razorpay halted → set HALTED locally
  | 'past_due'     // Razorpay pending → set PAST_DUE locally
  | 'no_change'    // Nothing to update
  | 'api_error';   // Razorpay API unreachable

interface RazorpaySubscription {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number;  // Unix timestamp (seconds)
  current_end?: number;    // Unix timestamp (seconds)
  notes?: Record<string, string>;
}

export async function syncWithRazorpay(
  prisma: PrismaClient,
  subscription: Subscription,
): Promise<SyncResult> {
  if (!subscription.razorpaySubscriptionId) {
    return 'no_change';
  }

  let rzSub: RazorpaySubscription;
  try {
    const rz = getRazorpay();
    rzSub = await rz.subscriptions.fetch(
      subscription.razorpaySubscriptionId,
    ) as unknown as RazorpaySubscription;
  } catch {
    return 'api_error';
  }

  const rzStatus = rzSub.status;

  // Razorpay "active" — check if a new billing cycle started
  if (rzStatus === 'active') {
    if (rzSub.current_start && rzSub.current_end) {
      const rzPeriodStart = new Date(rzSub.current_start * 1000);

      // If Razorpay's period start is newer than ours, a renewal happened
      if (rzPeriodStart.getTime() > subscription.currentPeriodStart.getTime()) {
        const rzPeriodEnd = new Date(rzSub.current_end * 1000);

        // Look up limits from ProductPlan
        const productPlan = await prisma.productPlan.findFirst({
          where: { razorpayPlanId: rzSub.plan_id },
        });

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
            usageCount: 0,
            currentPeriodStart: rzPeriodStart,
            currentPeriodEnd: rzPeriodEnd,
            ...(productPlan ? {
              plan: productPlan.plan,
              usageLimit: productPlan.usageLimit,
            } : {}),
          },
        });
        return 'renewed';
      }
    }

    // Active but no newer period — just ensure status is ACTIVE
    if (subscription.status !== 'ACTIVE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' },
      });
    }
    return 'no_change';
  }

  // Razorpay cancelled/completed/expired → downgrade to FREE
  if (['cancelled', 'completed', 'expired'].includes(rzStatus)) {
    await downgradeToFree(prisma, subscription);
    return 'downgraded';
  }

  // Razorpay halted → set HALTED locally
  if (rzStatus === 'halted') {
    if (subscription.status !== 'HALTED') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'HALTED' },
      });
    }
    return 'halted';
  }

  // Razorpay pending → set PAST_DUE locally
  if (rzStatus === 'pending') {
    if (subscription.status !== 'PAST_DUE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'PAST_DUE' },
      });
    }
    return 'past_due';
  }

  return 'no_change';
}
