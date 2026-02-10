import type { FastifyRequest } from 'fastify';
import type { FastifyInstance } from 'fastify';
import { UsageLimitError } from '../utils/errors.js';

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

  // Handle period reset for free plans
  const now = new Date();
  if (now > subscription.currentPeriodEnd) {
    const newStart = now;
    const newEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        usageCount: 0,
        currentPeriodStart: newStart,
        currentPeriodEnd: newEnd,
      },
    });
    return; // Period reset — usage is now 0, allow the request
  }

  // -1 means unlimited
  if (subscription.usageLimit === -1) return;

  if (subscription.usageCount >= subscription.usageLimit) {
    throw new UsageLimitError(
      `Usage limit reached (${subscription.usageCount}/${subscription.usageLimit}). Upgrade your plan for more generations.`,
    );
  }
}
