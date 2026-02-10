import type { FastifyInstance } from 'fastify';
import { createHash } from 'crypto';
import { config } from '../../config.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../plugins/auth.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { ConflictError, UnauthorizedError } from '../../utils/errors.js';
import type {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  ChangePasswordRequest,
  AuthResponse,
  UserProfile,
  ProductSubscription,
} from '@prism/shared';
import { ValidationError } from '../../utils/errors.js';

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

interface UserWithSubscriptions {
  id: string;
  email: string;
  name: string;
  defaultTemplateId: string | null;
  createdAt: Date;
  subscriptions: {
    plan: string;
    status: string;
    usageCount: number;
    usageLimit: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    product: {
      slug: string;
      name: string;
    };
  }[];
}

function toUserProfile(user: UserWithSubscriptions): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    defaultTemplateId: user.defaultTemplateId,
    createdAt: user.createdAt.toISOString(),
    subscriptions: user.subscriptions.map(
      (sub): ProductSubscription => ({
        productSlug: sub.product.slug,
        productName: sub.product.name,
        plan: sub.plan as ProductSubscription['plan'],
        status: sub.status as ProductSubscription['status'],
        usageCount: sub.usageCount,
        usageLimit: sub.usageLimit,
        currentPeriodStart: sub.currentPeriodStart.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      }),
    ),
  };
}

const userInclude = {
  subscriptions: {
    include: {
      product: { select: { slug: true, name: true } },
    },
  },
} as const;

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

    // Create user + FREE subscriptions for all active products in a transaction
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const activeProducts = await fastify.prisma.product.findMany({
      where: { isActive: true },
      include: {
        plans: { where: { plan: 'FREE' } },
      },
    });

    const user = await fastify.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, passwordHash, name },
      });

      // Create FREE subscription for each active product
      for (const product of activeProducts) {
        const freePlan = product.plans[0];
        await tx.subscription.create({
          data: {
            userId: newUser.id,
            productId: product.id,
            plan: 'FREE',
            status: 'ACTIVE',
            usageCount: 0,
            usageLimit: freePlan?.usageLimit ?? 5,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: newUser.id },
        include: userInclude,
      });
    });

    if (!user) throw new Error('Failed to create user');

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

    const user = await fastify.prisma.user.findUnique({
      where: { email },
      include: userInclude,
    });
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
      await fastify.prisma.refreshToken.deleteMany({ where: { id: storedToken.id } });
      throw new UnauthorizedError('Refresh token expired');
    }

    // Delete the used token (rotation) — use deleteMany to avoid P2025 from concurrent requests
    await fastify.prisma.refreshToken.deleteMany({ where: { id: storedToken.id } });

    // Issue new tokens
    const user = await fastify.prisma.user.findUnique({
      where: { id: payload.userId },
      include: userInclude,
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

  // POST /api/auth/change-password
  fastify.post<{ Body: ChangePasswordRequest }>('/change-password', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
    },
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body;

    const user = await fastify.prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new ValidationError('Current password is incorrect');
    }

    const newHash = await hashPassword(newPassword);
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return reply.send({ message: 'Password updated successfully' });
  });

  // GET /api/auth/profile
  fastify.get('/profile', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.userId },
      include: userInclude,
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return reply.send(toUserProfile(user));
  });
}
