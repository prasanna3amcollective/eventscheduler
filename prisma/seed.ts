import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: 'developer' },
    update: {},
    create: {
      name: 'developer',
    },
  });

  console.log('Seeded role: developer');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
