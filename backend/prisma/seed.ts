import { PrismaClient } from '@prisma/client';
import { PREDEFINED_TEMPLATES, PLAN_LIMITS } from '@prism/shared';
import type { Plan } from '@prism/shared';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed predefined templates
  console.log('Seeding predefined templates...');

  for (const template of PREDEFINED_TEMPLATES) {
    await prisma.template.upsert({
      where: {
        id: `predefined-${template.name.toLowerCase()}`,
      },
      update: {
        name: template.name,
        description: template.description,
        body: template.body,
        isPredefined: true,
      },
      create: {
        id: `predefined-${template.name.toLowerCase()}`,
        name: template.name,
        description: template.description,
        body: template.body,
        isPredefined: true,
        userId: null,
      },
    });
    console.log(`  ✓ ${template.name}`);
  }

  // 2. Seed the PRism product
  console.log('Seeding products...');

  const prism = await prisma.product.upsert({
    where: { slug: 'prism' },
    update: {
      name: 'PRism',
      description: 'AI-powered PR descriptions in one click',
    },
    create: {
      id: 'product-prism',
      slug: 'prism',
      name: 'PRism',
      description: 'AI-powered PR descriptions in one click',
    },
  });
  console.log(`  ✓ Product: ${prism.name}`);

  // 3. Seed ProductPlans for PRism
  console.log('Seeding product plans...');

  const plans: { plan: Plan; monthlyPrice: number; usageLimit: number }[] = [
    { plan: 'FREE', monthlyPrice: 0, usageLimit: 5 },
    { plan: 'PRO', monthlyPrice: 249, usageLimit: 50 },      // 900 = $9.00 in cents
    { plan: 'MAX', monthlyPrice: 999, usageLimit: -1 },      // -1 = unlimited
  ];

  for (const p of plans) {
    await prisma.productPlan.upsert({
      where: {
        productId_plan: { productId: prism.id, plan: p.plan },
      },
      update: {
        monthlyPrice: p.monthlyPrice,
        usageLimit: p.usageLimit,
      },
      create: {
        productId: prism.id,
        plan: p.plan,
        monthlyPrice: p.monthlyPrice,
        usageLimit: p.usageLimit,
      },
    });
    console.log(`  ✓ ${prism.name} ${p.plan}: ${p.usageLimit === -1 ? 'unlimited' : p.usageLimit}/mo @ $${(p.monthlyPrice / 100).toFixed(2)}`);
  }

  // 4. Create subscriptions for existing users who don't have one yet
  console.log('Checking for users without subscriptions...');

  const usersWithoutSub = await prisma.user.findMany({
    where: {
      subscriptions: { none: { productId: prism.id } },
    },
    select: { id: true },
  });

  if (usersWithoutSub.length > 0) {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const user of usersWithoutSub) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          productId: prism.id,
          plan: 'FREE',
          status: 'ACTIVE',
          usageCount: 0,
          usageLimit: PLAN_LIMITS.FREE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }
    console.log(`  ✓ Created FREE subscriptions for ${usersWithoutSub.length} existing user(s)`);
  } else {
    console.log('  ✓ All users already have subscriptions');
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
