const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🔧 Setting up inhouse ACL...\n');

  // 1. Create the "inhouse" role
  let inhouseRole = await prisma.role.findFirst({ where: { name: 'inhouse' } });
  if (!inhouseRole) {
    inhouseRole = await prisma.role.create({
      data: {
        name: 'inhouse',
        description: 'Inhouse users - Can create and manage events'
      }
    });
    console.log('✅ Created "inhouse" role');
  } else {
    console.log('ℹ️  "inhouse" role already exists');
  }

  // 2. Remove old activity ACLs (we're replacing the policy)
  await prisma.accessControlList.deleteMany({
    where: { table: 'activity' }
  });
  console.log('🗑️  Cleared old activity ACLs');

  // 3. Create new ACLs: both core AND inhouse can create/write/delete activities
  const coreRole = await prisma.role.findFirst({ where: { name: 'core' } });
  const operations = ['create', 'write', 'delete'];

  for (const op of operations) {
    // inhouse can do it
    await prisma.accessControlList.create({
      data: {
        table: 'activity',
        operation: op,
        roleId: inhouseRole.id,
        description: `Inhouse users can ${op} activities`
      }
    });

    // core can also do it
    if (coreRole) {
      await prisma.accessControlList.create({
        data: {
          table: 'activity',
          operation: op,
          roleId: coreRole.id,
          description: `Admins can ${op} activities`
        }
      });
    }
  }
  console.log('✅ Created activity ACLs for "inhouse" and "core" roles');

  // 4. Find user prasanna and assign the inhouse role
  const prasanna = await prisma.user.findFirst({
    where: { OR: [{ username: 'prasanna' }, { name: 'prasanna' }, { name: 'Prasanna' }] }
  });

  if (prasanna) {
    try {
      await prisma.userRole.create({
        data: { userId: prasanna.id, roleId: inhouseRole.id }
      });
      console.log(`✅ Assigned "inhouse" role to ${prasanna.name}`);
    } catch (e) {
      if (e.code === 'P2002') {
        console.log(`ℹ️  ${prasanna.name} already has "inhouse" role`);
      } else throw e;
    }
  } else {
    console.log('⚠️  User "prasanna" not found. You can assign the role manually from the Administration panel.');
  }

  console.log('\n🎉 Done! ACL policy:');
  console.log('   Event create/write/delete → inhouse, core');
  console.log('   Event read → open to all (no ACL = open)');
}

seed()
  .catch(e => console.error('❌ Error:', e))
  .finally(() => prisma.$disconnect());
