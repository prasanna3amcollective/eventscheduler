const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function renameAdminRole() {
  console.log('🔄 Renaming "admin" role to "core" in the database...');

  const role = await prisma.role.findFirst({
    where: { name: 'admin' }
  });

  if (role) {
    await prisma.role.update({
      where: { id: role.id },
      data: { 
        name: 'core',
        description: 'Core Administrator - Full access to all tables'
      }
    });
    console.log('✅ Successfully renamed "admin" to "core".');
  } else {
    const coreRole = await prisma.role.findFirst({ where: { name: 'core' } });
    if (coreRole) {
      console.log('ℹ️  "core" role already exists.');
    } else {
      console.log('⚠️  Neither "admin" nor "core" role found.');
    }
  }
}

renameAdminRole()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
