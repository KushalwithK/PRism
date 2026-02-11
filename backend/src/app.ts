import Fastify from 'fastify';
import rawBodyPlugin from 'fastify-raw-body';
import { config } from './config.js';

// Plugins
import prismaPlugin from './plugins/prisma.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import errorHandlerPlugin from './plugins/error-handler.js';

// Routes
import authRoutes from './routes/auth/index.js';
import templateRoutes from './routes/templates/index.js';
import generateRoutes from './routes/generate/index.js';
import historyRoutes from './routes/history/index.js';
import usageRoutes from './routes/usage/index.js';
import billingRoutes from './routes/billing/index.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'info' : 'debug',
    },
  });

  // Register plugins
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(rawBodyPlugin, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  });

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(templateRoutes, { prefix: '/api/templates' });
  await app.register(generateRoutes, { prefix: '/api/generate' });
  await app.register(historyRoutes, { prefix: '/api/history' });
  await app.register(usageRoutes, { prefix: '/api/usage' });
  await app.register(billingRoutes, { prefix: '/api/billing' });

  // Health check
  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
