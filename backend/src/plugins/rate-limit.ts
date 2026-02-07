import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { config } from '../config.js';

async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: config.rateLimit.global.max,
    timeWindow: config.rateLimit.global.timeWindow,
  });
}

export default fp(rateLimitPlugin, { name: 'rate-limit' });
