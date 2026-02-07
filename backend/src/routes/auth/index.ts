import type { FastifyInstance } from 'fastify';
import { createHash } from 'crypto';
import { config } from '../../config.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../plugins/auth.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { ConflictError, UnauthorizedError, ValidationError } from '../../utils/errors.js';
import type { RegisterRequest, LoginRequest, RefreshRequest, AuthResponse, UserProfile } from '@prism/shared';

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function toUserProfile(user: {
  id: string;
  email: string;
  name: string;
  plan: string;
  usageCount: number;
  defaultTemplateId: string | null;
}): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan as UserProfile['plan'],
    usageCount: user.usageCount,
    defaultTemplateId: user.defaultTemplateId,
  };
}

async function createRefreshTokenRecord(
  prisma: FastifyInstance['prisma'],
  userId: string,
  rawToken: string,
) {
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresInDays);

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
}

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/register
  fastify.post<{ Body: RegisterRequest }>('/register', {
    config: { rateLimit: config.rateLimit.auth },
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password, name } = request.body;

    const existing = await fastify.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await hashPassword(password);
    const user = await fastify.prisma.user.create({
      data: { email, passwordHash, name },
    });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    await createRefreshTokenRecord(fastify.prisma, user.id, refreshToken);

    const response: AuthResponse = {
      user: toUserProfile(user),
      tokens: { accessToken, refreshToken },
    };

    return reply.status(201).send(response);
  });

  // POST /api/auth/login
  fastify.post<{ Body: LoginRequest }>('/login', {
    config: { rateLimit: config.rateLimit.auth },
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;

    const user = await fastify.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    await createRefreshTokenRecord(fastify.prisma, user.id, refreshToken);

    const response: AuthResponse = {
      user: toUserProfile(user),
      tokens: { accessToken, refreshToken },
    };

    return reply.send(response);
  });

  // POST /api/auth/refresh
  fastify.post<{ Body: RefreshRequest }>('/refresh', {
    config: { rateLimit: config.rateLimit.auth },
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { refreshToken: rawToken } = request.body;

    // Verify JWT validity
    const payload = verifyRefreshToken(rawToken);
    const tokenHash = sha256(rawToken);

    // Find the token record
    const storedToken = await fastify.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      // Token reuse detected — revoke all tokens for this user
      await fastify.prisma.refreshToken.deleteMany({
        where: { userId: payload.userId },
      });
      throw new UnauthorizedError('Token reuse detected. All sessions revoked.');
    }

    if (storedToken.expiresAt < new Date()) {
      await fastify.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedError('Refresh token expired');
    }

    // Delete the used token (rotation)
    await fastify.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Issue new tokens
    const user = await fastify.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    await createRefreshTokenRecord(fastify.prisma, user.id, newRefreshToken);

    const response: AuthResponse = {
      user: toUserProfile(user),
      tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    };

    return reply.send(response);
  });

  // GET /api/auth/profile
  fastify.get('/profile', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return reply.send(toUserProfile(user));
  });
}
