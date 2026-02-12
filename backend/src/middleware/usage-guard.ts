import type { FastifyRequest } from 'fastify';
import type { FastifyInstance } from 'fastify';
import { UsageLimitError, SubscriptionBlockedError } from '../utils/errors.js';
import { config } from '../config.js';
import {
  calculateNextFreePeriod,
  syncWithRazorpay,
  downgradeToFree,
} from '../services/subscription-sync.js';

const PRISM_PRODUCT_SLUG = 'prism';

export async function usageGuard(this: FastifyInstance, request: FastifyRequest) {
  const subscription = await this.prisma.subscription.findFirst({
    where: {
      userId: request.userId,
      product: { slug: PRISM_PRODUCT_SLUG },
    },
  });

  if (!subscription) {
    throw new Error('No subscription found for this product');
  }

  const now = Date.now();
  const periodExpired = now > subscription.currentPeriodEnd.getTime();
  const isPaidPlan = subscription.plan !== 'FREE';

  // ── Path A: FREE plan ──
  if (!isPaidPlan) {
    if (periodExpired) {
      // Auto-reset with anchored timing (no drift)
      const { periodStart, periodEnd } = calculateNextFreePeriod(
        subscription.createdAt,
      );
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          usageCount: 0,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });
      return; // Period reset — usage is now 0
    }

    // Period active — check usage limit
    if (subscription.usageLimit !== -1 && subscription.usageCount >= subscription.usageLimit) {
      throw new UsageLimitError(
        `Usage limit reached (${subscription.usageCount}/${subscription.usageLimit}). Upgrade your plan for more generations.`,
      );
    }
    return;
  }

  // ── Path B: PAID plan, period NOT expired ──
  if (!periodExpired) {
    // CANCELED with active period = inconsistent state → force downgrade
    if (subscription.status === 'CANCELED') {
      await downgradeToFree(this.prisma, subscription);
      return; // Now on FREE with reset usage
    }

    // HALTED → block access
    if (subscription.status === 'HALTED') {
      throw new SubscriptionBlockedError(
        'Your subscription payment has failed. Please update your payment method to continue.',
      );
    }

    // ACTIVE or PAST_DUE → normal usage check (PAST_DUE keeps access while Razorpay retries)
    if (subscription.usageLimit !== -1 && subscription.usageCount >= subscription.usageLimit) {
      throw new UsageLimitError(
        `Usage limit reached (${subscription.usageCount}/${subscription.usageLimit}). Resets at the start of your next billing period.`,
      );
    }
    return;
  }

  // ── Path C: PAID plan, period EXPIRED ──
  const msPastExpiry = now - subscription.currentPeriodEnd.getTime();

  // Within grace period (2h) + status ACTIVE → allow access, don't extend
  if (msPastExpiry <= config.subscription.gracePeriodMs && subscription.status === 'ACTIVE') {
    // Allow — webhook should arrive soon to update the period
    if (subscription.usageLimit !== -1 && subscription.usageCount >= subscription.usageLimit) {
      throw new UsageLimitError(
        `Usage limit reached (${subscription.usageCount}/${subscription.usageLimit}). Resets at the start of your next billing period.`,
      );
    }
    return;
  }

  // Past grace period → sync with Razorpay
  const result = await syncWithRazorpay(this.prisma, subscription);

  switch (result) {
    case 'renewed':
      // Period was updated and usage reset by sync — allow
      return;

    case 'downgraded':
      // Now on FREE with reset usage — allow
      return;

    case 'halted':
      throw new SubscriptionBlockedError(
        'Your subscription payment has failed. Please update your payment method to continue.',
      );

    case 'past_due':
      // Razorpay is still retrying — allow access
      return;

    case 'api_error':
      // Razorpay API unreachable — fail-open for previously ACTIVE subs
      if (subscription.status === 'ACTIVE') {
        // Allow access — cron will reconcile later
        if (subscription.usageLimit !== -1 && subscription.usageCount >= subscription.usageLimit) {
          throw new UsageLimitError(
            `Usage limit reached (${subscription.usageCount}/${subscription.usageLimit}). Resets at the start of your next billing period.`,
          );
        }
        return;
      }
      // Not ACTIVE + API error → block
      throw new SubscriptionBlockedError(
        'Unable to verify subscription status. Please try again later.',
      );

    default:
      // no_change — check limits as-is
      if (subscription.usageLimit !== -1 && subscription.usageCount >= subscription.usageLimit) {
        throw new UsageLimitError(
          `Usage limit reached (${subscription.usageCount}/${subscription.usageLimit}). Resets at the start of your next billing period.`,
        );
      }
      return;
  }
}
