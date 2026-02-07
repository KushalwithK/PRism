import { PrismaClient } from '@prisma/client';
import { PREDEFINED_TEMPLATES } from '@prism/shared';

const prisma = new PrismaClient();

async function main() {
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
