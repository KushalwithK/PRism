import type { FastifyRequest } from 'fastify';
import type { FastifyInstance } from 'fastify';
import { PLAN_LIMITS } from '@prism/shared';
import type { Plan } from '@prism/shared';
import { UsageLimitError } from '../utils/errors.js';

export async function usageGuard(this: FastifyInstance, request: FastifyRequest) {
  const user = await this.prisma.user.findUnique({
    where: { id: request.userId },
    select: { plan: true, usageCount: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const limit = PLAN_LIMITS[user.plan as Plan];
  if (user.usageCount >= limit) {
    throw new UsageLimitError(
      `Usage limit reached (${user.usageCount}/${limit}). Upgrade your plan for more generations.`,
    );
  }
}
