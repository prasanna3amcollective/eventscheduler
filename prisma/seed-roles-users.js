const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create roles
  const roles = ['core', 'inhouse', 'developer', 'team'];

  for (const roleName of roles) {
    const existing = await prisma.role.findFirst({ where: { name: roleName } });
    if (!existing) {
      await prisma.role.create({ data: { name: roleName } });
      console.log(`Created role: ${roleName}`);
    } else {
      console.log(`Role already exists: ${roleName}`);
    }
  }

  // Create sample developer user
  const existingUser = await prisma.user.findUnique({ where: { username: 'sample developer' } });

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        name: 'Sample Developer',
        username: 'sample developer',
        email: 'sample.developer@example.com',
        phone: '0000000000',
        password: 'sample123', // In real app this should be hashed
      },
    });
    console.log(`Created user: ${user.username}`);
  } else {
    console.log('User "sample developer" already exists');
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
