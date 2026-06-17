// seed.cjs - CommonJS version of the seed script
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Running seed...\n');

  // 1. Create roles: core, inhouse, developer
  const roles = [
    { name: 'core', description: 'System Administrator - Full access to all tables' },
    { name: 'inhouse', description: 'Inhouse users - Can create and manage events' },
    { name: 'developer', description: 'Developer - Access to Developer Panel' },
  ];

  for (const role of roles) {
    const existing = await prisma.role.findFirst({ where: { name: role.name } });
    if (!existing) {
      await prisma.role.create({ data: role });
      console.log(`✅ Created role: ${role.name}`);
    } else {
      console.log(`ℹ️  Role already exists: ${role.name}`);
    }
  }

  // 2. Create user "3amdev"
  const hashedPassword = await bcrypt.hash('Vr1@3amc', 10);
  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: '3amdev',
        username: '3amdev',
        phone: '0000000000',
        email: '3amdev@system.local',
        password: hashedPassword,
      },
    });
    console.log(`✅ Created user: ${user.username} (password: 3amdev123)`);
  } catch (e) {
    if (e.code === 'P2002') {
      user = await prisma.user.findUnique({ where: { username: '3amdev' } });
      console.log('ℹ️  User "3amdev" already exists');
    } else {
      throw e;
    }
  }

  // 3. Assign "developer" role to "3amdev"
  const developerRole = await prisma.role.findFirst({ where: { name: 'developer' } });
  if (user && developerRole) {
    try {
      await prisma.userRole.create({ data: { userId: user.id, roleId: developerRole.id } });
      console.log('✅ Assigned "developer" role to "3amdev"');
    } catch (e) {
      if (e.code === 'P2002') {
        console.log('ℹ️  "developer" role already assigned to "3amdev"');
      } else {
        throw e;
      }
    }
  }

  console.log('\n🎉 Seed completed!');
  console.log('   Login with: username=3amdev, password=3amdev123');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
