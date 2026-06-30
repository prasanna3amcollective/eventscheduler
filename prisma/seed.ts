import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if group exists, if not create it
  const existingGroup = await prisma.group.findFirst({
    where: { name: 'tech community' },
  });

  if (!existingGroup) {
    await prisma.group.create({
      data: {
        name: 'tech community',
        description: '3AM TECH COMMUNITY',
        category: 'Community',
      },
    });
    console.log('Created group "tech community"');
  } else {
    console.log('Group "tech community" already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });