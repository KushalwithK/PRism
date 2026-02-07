import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { UnauthorizedError } from '../utils/errors.js';

export interface JwtPayload {
  userId: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    userEmail: string;
  }
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: `${config.jwt.refreshExpiresInDays}d`,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('userId', '');
  fastify.decorateRequest('userEmail', '');

  fastify.decorate('authenticate', async function (request: FastifyRequest) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing authorization header');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    request.userId = payload.userId;
    request.userEmail = payload.email;
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

export default fp(authPlugin, { name: 'auth' });
