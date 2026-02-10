import type { FastifyInstance } from 'fastify';
import { DEFAULT_TEMPLATE_NAME, MAX_DIFF_LENGTH } from '@prism/shared';
import type { GenerateRequest, GenerateResponse } from '@prism/shared';
import { config } from '../../config.js';
import { usageGuard } from '../../middleware/usage-guard.js';
import { getAIProvider } from '../../providers/factory.js';
import { buildPrompt } from '../../providers/prompt-builder.js';
import { extractPlaceholders, renderTemplate } from '../../utils/template-renderer.js';
import { NotFoundError } from '../../utils/errors.js';

const PRISM_PRODUCT_SLUG = 'prism';

export default async function generateRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /api/generate
  fastify.post<{ Body: GenerateRequest }>('/', {
    config: { rateLimit: config.rateLimit.generate },
    preHandler: [usageGuard.bind(fastify)],
    schema: {
      body: {
        type: 'object',
        required: ['diff', 'platform', 'repoUrl'],
        properties: {
          diff: { type: 'string', minLength: 1, maxLength: MAX_DIFF_LENGTH },
          platform: { type: 'string', enum: ['github', 'gitlab'] },
          repoUrl: { type: 'string' },
          baseBranch: { type: 'string' },
          compareBranch: { type: 'string' },
          templateId: { type: 'string' },
          additionalPrompt: { type: 'string', maxLength: 2000 },
        },
      },
    },
  }, async (request, reply) => {
    const { diff, platform, repoUrl, baseBranch, compareBranch, templateId, additionalPrompt } = request.body;

    // 1. Resolve template
    let template;
    if (templateId) {
      template = await fastify.prisma.template.findUnique({ where: { id: templateId } });
      if (!template) throw new NotFoundError('Template not found');
    } else {
      // Try user's default template
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.userId },
        include: { defaultTemplate: true },
      });
      template = user?.defaultTemplate;

      // Fallback to "Standard" predefined
      if (!template) {
        template = await fastify.prisma.template.findFirst({
          where: { isPredefined: true, name: DEFAULT_TEMPLATE_NAME },
        });
      }
    }

    if (!template) {
      throw new NotFoundError('No template available');
    }

    // 2. Extract placeholders from template
    const placeholderKeys = extractPlaceholders(template.body);

    // 3. Build prompt
    const prompt = buildPrompt(diff, placeholderKeys, additionalPrompt, template.name);

    // 4. Call AI provider
    const provider = getAIProvider();
    const aiResult = await provider.generate(prompt);

    // 5. Render template
    const description = renderTemplate(template.body, aiResult.placeholders);
    const title = aiResult.title;

    // 6. Create a short diff summary (first 500 chars)
    const diffSummary = diff.length > 500
      ? diff.slice(0, 500) + '...'
      : diff;

    // 7. Resolve product ID, then atomically increment usage + create generation
    const product = await fastify.prisma.product.findUnique({
      where: { slug: PRISM_PRODUCT_SLUG },
      select: { id: true },
    });

    if (!product) throw new Error('PRism product not found — run seed');

    const [generation, subscription] = await fastify.prisma.$transaction([
      fastify.prisma.generation.create({
        data: {
          userId: request.userId,
          templateId: template.id,
          platform,
          repoUrl,
          baseBranch: baseBranch || null,
          compareBranch: compareBranch || null,
          prTitle: title,
          prDescription: description,
          diffSummary,
          promptTokens: aiResult.tokenUsage?.promptTokens ?? null,
          completionTokens: aiResult.tokenUsage?.completionTokens ?? null,
          totalTokens: aiResult.tokenUsage?.totalTokens ?? null,
        },
      }),
      fastify.prisma.subscription.update({
        where: {
          userId_productId: {
            userId: request.userId,
            productId: product.id,
          },
        },
        data: { usageCount: { increment: 1 } },
      }),
    ]);

    const response: GenerateResponse = {
      title,
      description,
      generation: {
        id: generation.id,
        templateName: template.name,
      },
      usage: {
        product: PRISM_PRODUCT_SLUG,
        used: subscription.usageCount,
        limit: subscription.usageLimit,
        plan: subscription.plan,
        remaining: subscription.usageLimit === -1 ? -1 : subscription.usageLimit - subscription.usageCount,
        periodEnd: subscription.currentPeriodEnd.toISOString(),
      },
    };

    return reply.send(response);
  });
}
