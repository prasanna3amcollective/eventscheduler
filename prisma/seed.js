const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.role.findFirst({
    where: { name: 'developer' },
  });

  if (!existing) {
    await prisma.role.create({
      data: { name: 'developer' },
    });
    console.log('Seeded role: developer');
  } else {
    console.log('Role "developer" already exists');
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
