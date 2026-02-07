import type { FastifyInstance } from 'fastify';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import type { CreateTemplateRequest, UpdateTemplateRequest } from '@prism/shared';

export default async function templateRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/templates — list user's custom + all predefined templates
  fastify.get('/', async (request, reply) => {
    const templates = await fastify.prisma.template.findMany({
      where: {
        OR: [
          { isPredefined: true },
          { userId: request.userId },
        ],
      },
      orderBy: [
        { isPredefined: 'desc' },
        { name: 'asc' },
      ],
    });

    return reply.send(templates);
  });

  // GET /api/templates/:id
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const template = await fastify.prisma.template.findUnique({
      where: { id: request.params.id },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Users can view predefined templates or their own
    if (!template.isPredefined && template.userId !== request.userId) {
      throw new ForbiddenError('Access denied');
    }

    return reply.send(template);
  });

  // POST /api/templates — create custom template
  fastify.post<{ Body: CreateTemplateRequest }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'body'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          body: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { name, description = '', body } = request.body;

    const template = await fastify.prisma.template.create({
      data: {
        name,
        description,
        body,
        userId: request.userId,
        isPredefined: false,
      },
    });

    return reply.status(201).send(template);
  });

  // PUT /api/templates/:id — update custom template
  fastify.put<{ Params: { id: string }; Body: UpdateTemplateRequest }>('/:id', {
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          body: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const template = await fastify.prisma.template.findUnique({
      where: { id: request.params.id },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    if (template.isPredefined) {
      throw new ForbiddenError('Cannot modify predefined templates');
    }

    if (template.userId !== request.userId) {
      throw new ForbiddenError('Access denied');
    }

    const updated = await fastify.prisma.template.update({
      where: { id: template.id },
      data: request.body,
    });

    return reply.send(updated);
  });

  // DELETE /api/templates/:id
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const template = await fastify.prisma.template.findUnique({
      where: { id: request.params.id },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    if (template.isPredefined) {
      throw new ForbiddenError('Cannot delete predefined templates');
    }

    if (template.userId !== request.userId) {
      throw new ForbiddenError('Access denied');
    }

    await fastify.prisma.template.delete({ where: { id: template.id } });

    return reply.status(204).send();
  });

  // PATCH /api/templates/:id/set-default
  fastify.patch<{ Params: { id: string } }>('/:id/set-default', async (request, reply) => {
    const template = await fastify.prisma.template.findUnique({
      where: { id: request.params.id },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Users can set predefined or their own templates as default
    if (!template.isPredefined && template.userId !== request.userId) {
      throw new ForbiddenError('Access denied');
    }

    await fastify.prisma.user.update({
      where: { id: request.userId },
      data: { defaultTemplateId: template.id },
    });

    return reply.send({ message: 'Default template updated', templateId: template.id });
  });
}
