import type { FastifyInstance } from 'fastify';
import { PLAN_LIMITS } from '@prism/shared';
import type { Plan, UsageStats } from '@prism/shared';
import { UnauthorizedError } from '../../utils/errors.js';

export default async function usageRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/usage
  fastify.get('/', async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.userId },
      select: { plan: true, usageCount: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const limit = PLAN_LIMITS[user.plan as Plan];
    const stats: UsageStats = {
      used: user.usageCount,
      limit: limit === Infinity ? -1 : limit,
      plan: user.plan as Plan,
      remaining: limit === Infinity ? -1 : limit - user.usageCount,
    };

    return reply.send(stats);
  });
}
