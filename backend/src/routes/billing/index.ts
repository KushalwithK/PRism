import type { FastifyInstance, FastifyRequest } from 'fastify';
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import { config } from '../../config.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import type { Plan, PlanFeature } from '@prism/shared';

let razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpay) {
    if (!config.razorpay.keyId || !config.razorpay.keySecret) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpay = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return razorpay;
}

export default async function billingRoutes(fastify: FastifyInstance) {
  // GET /api/billing/plans — public endpoint for pricing data
  fastify.get<{ Querystring: { productSlug: string } }>('/plans', {
    schema: {
      querystring: {
        type: 'object',
        required: ['productSlug'],
        properties: {
          productSlug: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const product = await fastify.prisma.product.findUnique({
      where: { slug: request.query.productSlug },
    });
    if (!product) throw new NotFoundError('Product not found');

    const plans = await fastify.prisma.productPlan.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: 'asc' },
    });

    return reply.send(plans.map((p) => ({
      plan: p.plan,
      displayName: p.displayName,
      description: p.description,
      monthlyPrice: p.monthlyPrice,
      currency: p.currency,
      period: p.period,
      features: p.features as unknown as PlanFeature[],
      highlighted: p.highlighted,
      badge: p.badge,
      usageLimit: p.usageLimit,
      sortOrder: p.sortOrder,
    })));
  });

  // POST /api/billing/checkout — create Razorpay subscription
  fastify.post<{
    Body: { productSlug: string; plan: string };
  }>('/checkout', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['productSlug', 'plan'],
        properties: {
          productSlug: { type: 'string' },
          plan: { type: 'string', enum: ['PRO', 'MAX'] },
        },
      },
    },
  }, async (request, reply) => {
    const { productSlug, plan } = request.body;
    const rz = getRazorpay();

    // Look up product plan to get razorpayPlanId
    const productPlan = await fastify.prisma.productPlan.findFirst({
      where: {
        product: { slug: productSlug },
        plan: plan as Plan,
      },
      include: { product: true },
    });

    if (!productPlan) {
      throw new NotFoundError('Product plan not found');
    }

    if (!productPlan.razorpayPlanId) {
      throw new ValidationError('This plan does not support paid subscriptions');
    }

    // Get or create Razorpay customer
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (!user) throw new Error('User not found');

    let customerId = user.razorpayCustomerId;

    if (!customerId) {
      const customer = await rz.customers.create({
        name: user.name,
        email: user.email,
      });
      customerId = customer.id;
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { razorpayCustomerId: customerId },
      });
    }

    // Create Razorpay subscription
    // Note: customer_id is accepted by the API but not in the SDK type definitions
    const rzSubscription = await rz.subscriptions.create({
      plan_id: productPlan.razorpayPlanId,
      total_count: 12,
      quantity: 1,
      notes: { customer_id: customerId, user_id: user.id, plan: plan },
    } as Parameters<typeof rz.subscriptions.create>[0]);

    // Link the Razorpay subscription ID to the user's subscription record
    // so webhooks can find it later
    await fastify.prisma.subscription.upsert({
      where: {
        userId_productId: { userId: user.id, productId: productPlan.productId },
      },
      update: {
        razorpaySubscriptionId: rzSubscription.id,
      },
      create: {
        userId: user.id,
        productId: productPlan.productId,
        plan: 'FREE',
        status: 'ACTIVE',
        usageCount: 0,
        usageLimit: productPlan.usageLimit,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        razorpaySubscriptionId: rzSubscription.id,
      },
    });

    return reply.send({
      subscriptionId: rzSubscription.id,
      razorpayKeyId: config.razorpay.keyId,
    });
  });

  // POST /api/billing/verify — verify payment after Razorpay checkout
  fastify.post<{
    Body: {
      razorpay_payment_id: string;
      razorpay_subscription_id: string;
      razorpay_signature: string;
    };
  }>('/verify', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['razorpay_payment_id', 'razorpay_subscription_id', 'razorpay_signature'],
        properties: {
          razorpay_payment_id: { type: 'string' },
          razorpay_subscription_id: { type: 'string' },
          razorpay_signature: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = request.body;
    const rz = getRazorpay();

    // Verify signature: HMAC-SHA256(payment_id + "|" + subscription_id, key_secret)
    const expectedSignature = createHmac('sha256', config.razorpay.keySecret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    if (razorpay_signature !== expectedSignature) {
      fastify.log.warn({ razorpay_subscription_id }, 'Verify: invalid signature');
      return reply.status(400).send({ error: 'Invalid payment signature' });
    }

    fastify.log.info({ razorpay_subscription_id, razorpay_payment_id }, 'Verify: signature valid');

    // Fetch subscription from Razorpay API to get current status and plan
    const rzSub = await rz.subscriptions.fetch(razorpay_subscription_id);
    fastify.log.info({ rzStatus: rzSub.status, rzPlanId: rzSub.plan_id, rzNotes: rzSub.notes }, 'Verify: Razorpay subscription fetched');

    // Not gating on status — signature verification above is the authorization check.
    // Razorpay may still show "created" due to async charge processing.
    fastify.log.info({ rzStatus: rzSub.status }, 'Verify: Razorpay subscription status (not gating)');

    // Find local subscription by razorpaySubscriptionId
    const existingSub = await fastify.prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: razorpay_subscription_id },
    });

    if (!existingSub) {
      fastify.log.error({ razorpay_subscription_id }, 'Verify: no local subscription found');
      return reply.status(404).send({ error: 'Subscription not found' });
    }

    fastify.log.info({ subId: existingSub.id, userId: existingSub.userId, productId: existingSub.productId }, 'Verify: local subscription found');

    // Verify it belongs to the authenticated user
    if (existingSub.userId !== request.userId) {
      fastify.log.warn({ subUserId: existingSub.userId, requestUserId: request.userId }, 'Verify: user mismatch');
      return reply.status(403).send({ error: 'Subscription does not belong to this user' });
    }

    // Look up ProductPlan by Razorpay plan ID to get correct plan/limits
    let productPlan = await fastify.prisma.productPlan.findFirst({
      where: { razorpayPlanId: rzSub.plan_id },
    });

    if (!productPlan && (rzSub as unknown as { notes?: Record<string, string> }).notes?.plan) {
      const notes = (rzSub as unknown as { notes: Record<string, string> }).notes;
      fastify.log.warn({ plan_id: rzSub.plan_id }, 'Verify: ProductPlan not found by razorpayPlanId, using notes fallback');
      productPlan = await fastify.prisma.productPlan.findFirst({
        where: {
          productId: existingSub.productId,
          plan: notes.plan as Plan,
        },
      });
    }

    if (!productPlan) {
      fastify.log.error({ rzPlanId: rzSub.plan_id }, 'Verify: ProductPlan not found (all lookups failed)');
      return reply.status(404).send({ error: 'Product plan not found' });
    }

    fastify.log.info({ productPlanId: productPlan.id, plan: productPlan.plan, usageLimit: productPlan.usageLimit }, 'Verify: ProductPlan resolved');

    // Activate subscription (idempotent — same update as webhook)
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const updated = await fastify.prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        plan: productPlan.plan,
        status: 'ACTIVE',
        usageLimit: productPlan.usageLimit,
        usageCount: 0,
        razorpaySubscriptionId: razorpay_subscription_id,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { product: true },
    });

    fastify.log.info({ subscriptionId: updated.id, plan: updated.plan }, 'Verify: subscription activated');

    return reply.send({
      productSlug: updated.product.slug,
      plan: updated.plan,
      status: updated.status,
      usageLimit: updated.usageLimit,
      currentPeriodStart: updated.currentPeriodStart.toISOString(),
      currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
      paymentId: razorpay_payment_id,
    });
  });

  // POST /api/billing/webhook — handle Razorpay webhook events
  fastify.post('/webhook', {
    config: { rawBody: true },
  }, async (request, reply) => {
    const signature = request.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return reply.status(400).send({ error: 'Missing signature' });
    }

    const body = (request as any).rawBody as string;
    if (!body) {
      return reply.status(400).send({ error: 'Missing request body' });
    }

    // Verify webhook signature
    const expectedSignature = createHmac('sha256', config.razorpay.webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return reply.status(400).send({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body) as {
      event: string;
      payload: {
        subscription?: { entity: { id: string; plan_id: string; status: string; notes?: Record<string, string> } };
        payment?: { entity: { id: string; subscription_id: string } };
      };
    };

    fastify.log.info({ event: event.event }, 'Razorpay webhook received');

    switch (event.event) {
      case 'subscription.activated': {
        const subEntity = event.payload.subscription?.entity;
        if (!subEntity) break;

        // Find the product plan by razorpayPlanId
        const productPlan = await fastify.prisma.productPlan.findFirst({
          where: { razorpayPlanId: subEntity.plan_id },
        });

        if (!productPlan) {
          fastify.log.warn({ planId: subEntity.plan_id }, 'Unknown Razorpay plan');
          break;
        }

        // Find subscription by razorpaySubscriptionId (set during checkout)
        let existingSub = await fastify.prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subEntity.id },
        });

        // Fallback: find by user_id from notes + product
        if (!existingSub && subEntity.notes?.user_id) {
          existingSub = await fastify.prisma.subscription.findUnique({
            where: {
              userId_productId: {
                userId: subEntity.notes.user_id,
                productId: productPlan.productId,
              },
            },
          });
        }

        if (existingSub) {
          const now = new Date();
          await fastify.prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
              plan: productPlan.plan,
              status: 'ACTIVE',
              usageLimit: productPlan.usageLimit,
              usageCount: 0,
              razorpaySubscriptionId: subEntity.id,
              currentPeriodStart: now,
              currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        } else {
          fastify.log.warn({ rzSubId: subEntity.id }, 'No matching subscription found for activation');
        }
        break;
      }

      case 'subscription.charged': {
        // Payment successful — reset usage for the period
        const subEntity = event.payload.subscription?.entity;
        if (!subEntity) break;

        const sub = await fastify.prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subEntity.id },
        });

        if (sub) {
          const now = new Date();
          const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          await fastify.prisma.subscription.update({
            where: { id: sub.id },
            data: {
              usageCount: 0,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              status: 'ACTIVE',
            },
          });
        }
        break;
      }

      case 'subscription.cancelled': {
        const subEntity = event.payload.subscription?.entity;
        if (!subEntity) break;

        const sub = await fastify.prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subEntity.id },
          include: { product: true },
        });

        if (sub) {
          // Find the FREE plan limits for this product
          const freePlan = await fastify.prisma.productPlan.findFirst({
            where: { productId: sub.productId, plan: 'FREE' },
          });

          await fastify.prisma.subscription.update({
            where: { id: sub.id },
            data: {
              plan: 'FREE',
              status: 'CANCELED',
              usageLimit: freePlan?.usageLimit ?? 5,
              razorpaySubscriptionId: null,
              cancelAtPeriodEnd: false,
            },
          });
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = event.payload.payment?.entity;
        const subscriptionId = paymentEntity?.subscription_id;
        if (!subscriptionId) break;

        const sub = await fastify.prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subscriptionId },
        });

        if (sub) {
          await fastify.prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }
    }

    return reply.send({ received: true });
  });

  // GET /api/billing/subscriptions — list user's subscriptions
  fastify.get('/subscriptions', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const subscriptions = await fastify.prisma.subscription.findMany({
      where: { userId: request.userId },
      include: {
        product: { select: { slug: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return reply.send(
      subscriptions.map((sub) => ({
        productSlug: sub.product.slug,
        productName: sub.product.name,
        plan: sub.plan,
        status: sub.status,
        usageCount: sub.usageCount,
        usageLimit: sub.usageLimit,
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        razorpaySubscriptionId: sub.razorpaySubscriptionId,
      })),
    );
  });
}
