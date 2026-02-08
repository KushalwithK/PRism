import type { FastifyInstance } from 'fastify';
import type { UpdateGenerationRequest } from '@prism/shared';
import { NotFoundError } from '../../utils/errors.js';

export default async function historyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/history — paginated list
  fastify.get<{
    Querystring: { page?: string; pageSize?: string; repoUrl?: string; baseBranch?: string; compareBranch?: string };
  }>('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string' },
          pageSize: { type: 'string' },
          repoUrl: { type: 'string' },
          baseBranch: { type: 'string' },
          compareBranch: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const page = Math.max(1, parseInt(request.query.page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(request.query.pageSize || '10', 10)));
    const skip = (page - 1) * pageSize;

    const where: { userId: string; repoUrl?: string; baseBranch?: string; compareBranch?: string } = { userId: request.userId };
    if (request.query.repoUrl) {
      where.repoUrl = request.query.repoUrl;
    }
    if (request.query.baseBranch) {
      where.baseBranch = request.query.baseBranch;
    }
    if (request.query.compareBranch) {
      where.compareBranch = request.query.compareBranch;
    }

    const [data, total] = await Promise.all([
      fastify.prisma.generation.findMany({
        where,
        include: { template: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      fastify.prisma.generation.count({
        where,
      }),
    ]);

    return reply.send({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  });

  // GET /api/history/:id
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const generation = await fastify.prisma.generation.findUnique({
      where: { id: request.params.id },
      include: { template: { select: { name: true } } },
    });

    if (!generation || generation.userId !== request.userId) {
      throw new NotFoundError('Generation not found');
    }

    return reply.send(generation);
  });

  // PATCH /api/history/:id — update title/description
  fastify.patch<{ Params: { id: string }; Body: UpdateGenerationRequest }>('/:id', {
    schema: {
      body: {
        type: 'object',
        properties: {
          prTitle: { type: 'string', maxLength: 200 },
          prDescription: { type: 'string', maxLength: 50000 },
        },
      },
    },
  }, async (request, reply) => {
    const generation = await fastify.prisma.generation.findUnique({
      where: { id: request.params.id },
    });

    if (!generation || generation.userId !== request.userId) {
      throw new NotFoundError('Generation not found');
    }

    const data: Record<string, string> = {};
    if (request.body.prTitle !== undefined) data.prTitle = request.body.prTitle;
    if (request.body.prDescription !== undefined) data.prDescription = request.body.prDescription;

    const updated = await fastify.prisma.generation.update({
      where: { id: request.params.id },
      data,
    });

    return reply.send({
      id: updated.id,
      prTitle: updated.prTitle,
      prDescription: updated.prDescription,
    });
  });
}
