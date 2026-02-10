import type { FastifyInstance } from 'fastify';
import type { UsageStats } from '@prism/shared';
import { UnauthorizedError } from '../../utils/errors.js';

const PRISM_PRODUCT_SLUG = 'prism';

export default async function usageRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/usage
  fastify.get('/', async (request, reply) => {
    const subscription = await fastify.prisma.subscription.findFirst({
      where: {
        userId: request.userId,
        product: { slug: PRISM_PRODUCT_SLUG },
      },
      include: { product: { select: { slug: true } } },
    });

    if (!subscription) {
      throw new UnauthorizedError('No subscription found');
    }

    const stats: UsageStats = {
      product: subscription.product.slug,
      used: subscription.usageCount,
      limit: subscription.usageLimit,
      plan: subscription.plan,
      remaining: subscription.usageLimit === -1
        ? -1
        : subscription.usageLimit - subscription.usageCount,
      periodEnd: subscription.currentPeriodEnd.toISOString(),
    };

    return reply.send(stats);
  });

  // GET /api/usage/analytics
  fastify.get<{
    Querystring: { product?: string; days?: string };
  }>('/analytics', async (request, reply) => {
    const productSlug = (request.query.product || PRISM_PRODUCT_SLUG) as string;
    const days = Math.min(Math.max(parseInt(request.query.days || '30', 10) || 30, 1), 90);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get subscription for period info
    const subscription = await fastify.prisma.subscription.findFirst({
      where: {
        userId: request.userId,
        product: { slug: productSlug },
      },
    });

    if (!subscription) {
      throw new UnauthorizedError('No subscription found');
    }

    // Group generations by day
    const dailyUsage = await fastify.prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM generations
      WHERE "userId" = ${request.userId}
        AND "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Group token usage by day
    const dailyTokens = await fastify.prisma.$queryRaw<
      Array<{ date: string; tokens: bigint }>
    >`
      SELECT DATE("createdAt") as date, COALESCE(SUM("totalTokens"), 0)::bigint as tokens
      FROM generations
      WHERE "userId" = ${request.userId}
        AND "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Summary stats
    const summary = await fastify.prisma.generation.aggregate({
      where: {
        userId: request.userId,
        createdAt: { gte: startDate },
      },
      _count: { id: true },
      _sum: { totalTokens: true },
    });

    const totalGenerations = summary._count.id;
    const totalTokens = summary._sum.totalTokens || 0;

    return reply.send({
      dailyUsage: dailyUsage.map((d) => ({
        date: new Date(d.date).toISOString().split('T')[0],
        count: Number(d.count),
      })),
      dailyTokens: dailyTokens.map((d) => ({
        date: new Date(d.date).toISOString().split('T')[0],
        tokens: Number(d.tokens),
      })),
      summary: {
        totalGenerations,
        totalTokens,
        avgTokensPerGeneration:
          totalGenerations > 0
            ? Math.round(totalTokens / totalGenerations)
            : 0,
        periodStart: subscription.currentPeriodStart.toISOString(),
        periodEnd: subscription.currentPeriodEnd.toISOString(),
      },
    });
  });
}
