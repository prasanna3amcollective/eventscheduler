const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  console.log('🔧 Bootstrapping core user...\n');

  // 1. Create or find the core role
  let coreRole = await prisma.role.findFirst({ where: { name: 'core' } });
  if (!coreRole) {
    coreRole = await prisma.role.create({
      data: {
        id: 'core-role-id',
        name: 'core',
        description: 'System Administrator - Full access to all tables'
      }
    });
    console.log('✅ Created core role');
  } else {
    console.log('ℹ️  Admin role already exists:', coreRole.id);
  }

  // 2. Create the core user
  const hashedPassword = await bcrypt.hash('core123', 10);
  let coreUser;
  try {
    coreUser = await prisma.user.create({
      data: {
        name: 'Admin',
        username: 'core',
        phone: '0000000000',
        email: 'core@system.local',
        password: hashedPassword
      }
    });
    console.log('✅ Created core user (username: core, password: core123)');
  } catch (e) {
    if (e.code === 'P2002') {
      coreUser = await prisma.user.findUnique({ where: { username: 'core' } });
      console.log('ℹ️  Admin user already exists:', coreUser.id);
    } else {
      throw e;
    }
  }

  // 3. Assign core role to user
  try {
    await prisma.userRole.create({
      data: {
        userId: coreUser.id,
        roleId: coreRole.id
      }
    });
    console.log('✅ Assigned core role to core user');
  } catch (e) {
    if (e.code === 'P2002') {
      console.log('ℹ️  Admin role already assigned');
    } else {
      throw e;
    }
  }

  // 4. Seed ACLs for Activity table (only cores can create/write/delete)
  const eventOps = ['create', 'write', 'delete'];
  for (const op of eventOps) {
    const existing = await prisma.accessControlList.findFirst({
      where: { table: 'activity', operation: op, roleId: coreRole.id }
    });
    if (!existing) {
      await prisma.accessControlList.create({
        data: {
          table: 'activity',
          operation: op,
          roleId: coreRole.id,
          description: `Only cores can ${op} activities`
        }
      });
      console.log(`✅ Created ACL: activity.${op} → core`);
    }
  }

  console.log('\n🎉 Bootstrap complete!');
  console.log('   Login with: username=core, password=core123');
}

seed()
  .catch(e => console.error('❌ Error:', e))
  .finally(() => prisma.$disconnect());
