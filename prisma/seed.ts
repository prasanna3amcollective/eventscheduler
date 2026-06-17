import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  await prisma.role.upsert({
    where: { id: 'dev-role' },
    update: {},
    create: { id: 'dev-role', name: 'developer', description: 'Developer role' },
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
