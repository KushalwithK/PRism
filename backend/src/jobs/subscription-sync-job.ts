import type { PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { config } from '../config.js';
import { syncWithRazorpay, downgradeToFree } from '../services/subscription-sync.js';

const BATCH_SIZE = 50;

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startSubscriptionSyncJob(prisma: PrismaClient, log: FastifyBaseLogger) {
  log.info(
    { intervalMs: config.subscription.syncIntervalMs },
    'Starting subscription sync job',
  );

  // Run immediately on startup, then on interval
  runSync(prisma, log).catch((err) => {
    log.error({ err }, 'Subscription sync job error (initial run)');
  });

  intervalId = setInterval(() => {
    runSync(prisma, log).catch((err) => {
      log.error({ err }, 'Subscription sync job error');
    });
  }, config.subscription.syncIntervalMs);
}

export function stopSubscriptionSyncJob(log: FastifyBaseLogger) {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    log.info('Subscription sync job stopped');
  }
}

async function runSync(prisma: PrismaClient, log: FastifyBaseLogger) {
  const thresholdDate = new Date(
    Date.now() - config.subscription.syncCheckThresholdMs,
  );

  // Find paid subscriptions past the sync threshold
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      razorpaySubscriptionId: { not: null },
      currentPeriodEnd: { lt: thresholdDate },
    },
    take: BATCH_SIZE,
    orderBy: { currentPeriodEnd: 'asc' },
  });

  if (expiredSubs.length === 0) {
    return;
  }

  log.info({ count: expiredSubs.length }, 'Syncing expired paid subscriptions');

  for (const sub of expiredSubs) {
    try {
      const result = await syncWithRazorpay(prisma, sub);
      log.info(
        { subscriptionId: sub.id, result },
        'Subscription sync result',
      );

      // Force-downgrade safety net: if API unreachable for 7+ days past expiry
      if (result === 'api_error') {
        const daysPastExpiry =
          (Date.now() - sub.currentPeriodEnd.getTime()) / (24 * 60 * 60 * 1000);

        if (daysPastExpiry >= config.subscription.haltedDowngradeDays) {
          log.warn(
            { subscriptionId: sub.id, daysPastExpiry },
            'Force-downgrading: API unreachable for too long',
          );
          await downgradeToFree(prisma, sub);
        }
      }
    } catch (err) {
      log.error({ subscriptionId: sub.id, err }, 'Subscription sync failed');
    }
  }

  // HALTED cleanup: auto-downgrade HALTED subscriptions after haltedDowngradeDays
  const haltedThreshold = new Date(
    Date.now() - config.subscription.haltedDowngradeDays * 24 * 60 * 60 * 1000,
  );

  const haltedSubs = await prisma.subscription.findMany({
    where: {
      status: 'HALTED',
      updatedAt: { lt: haltedThreshold },
    },
    take: BATCH_SIZE,
  });

  if (haltedSubs.length > 0) {
    log.info({ count: haltedSubs.length }, 'Auto-downgrading stale HALTED subscriptions');

    for (const sub of haltedSubs) {
      try {
        await downgradeToFree(prisma, sub);
        log.info({ subscriptionId: sub.id }, 'HALTED subscription downgraded to FREE');
      } catch (err) {
        log.error({ subscriptionId: sub.id, err }, 'HALTED downgrade failed');
      }
    }
  }
}
