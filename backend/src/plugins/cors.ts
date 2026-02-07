import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { config } from '../config.js';

async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}

export default fp(corsPlugin, { name: 'cors' });
