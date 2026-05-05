const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  console.log('🔧 Bootstrapping admin user...\n');

  // 1. Create or find the admin role
  let adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        id: 'admin-role-id',
        name: 'admin',
        description: 'System Administrator - Full access to all tables'
      }
    });
    console.log('✅ Created admin role');
  } else {
    console.log('ℹ️  Admin role already exists:', adminRole.id);
  }

  // 2. Create the admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  let adminUser;
  try {
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin',
        username: 'admin',
        phone: '0000000000',
        email: 'admin@system.local',
        password: hashedPassword,
        type: 'core'
      }
    });
    console.log('✅ Created admin user (username: admin, password: admin123)');
  } catch (e) {
    if (e.code === 'P2002') {
      adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
      console.log('ℹ️  Admin user already exists:', adminUser.id);
    } else {
      throw e;
    }
  }

  // 3. Assign admin role to user
  try {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
    console.log('✅ Assigned admin role to admin user');
  } catch (e) {
    if (e.code === 'P2002') {
      console.log('ℹ️  Admin role already assigned');
    } else {
      throw e;
    }
  }

  // 4. Seed ACLs for Event table (only admins can create/write/delete)
  const eventOps = ['create', 'write', 'delete'];
  for (const op of eventOps) {
    const existing = await prisma.accessControlList.findFirst({
      where: { table: 'event', operation: op, roleId: adminRole.id }
    });
    if (!existing) {
      await prisma.accessControlList.create({
        data: {
          table: 'event',
          operation: op,
          roleId: adminRole.id,
          description: `Only admins can ${op} events`
        }
      });
      console.log(`✅ Created ACL: event.${op} → admin`);
    }
  }

  console.log('\n🎉 Bootstrap complete!');
  console.log('   Login with: username=admin, password=admin123');
}

seed()
  .catch(e => console.error('❌ Error:', e))
  .finally(() => prisma.$disconnect());
