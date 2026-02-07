import type { FastifyInstance, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../utils/errors.js';

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError | AppError, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      });
    }

    const fastifyError = error as FastifyError;

    // Fastify validation errors
    if (fastifyError.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'ValidationError',
        message: fastifyError.message,
      });
    }

    // Rate limit errors
    if (fastifyError.statusCode === 429) {
      return reply.status(429).send({
        statusCode: 429,
        error: 'TooManyRequests',
        message: 'Rate limit exceeded',
      });
    }

    fastify.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
    });
  });
}

export default fp(errorHandlerPlugin, { name: 'error-handler' });
