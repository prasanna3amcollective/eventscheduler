const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Ensure "everyone" role exists
  let everyoneRole = await prisma.role.findFirst({ where: { name: 'everyone' } });
  if (!everyoneRole) {
    everyoneRole = await prisma.role.create({ data: { name: 'everyone' } });
    console.log('Created role: everyone');
  }

  // Ensure "everyone" group exists
  let everyoneGroup = await prisma.group.findFirst({ where: { name: 'everyone' } });
  if (!everyoneGroup) {
    everyoneGroup = await prisma.group.create({
      data: {
        name: 'everyone',
        description: 'Default group for all users',
        category: 'System',
      },
    });
    console.log('Created group: everyone');
  }

  // Ensure developer role exists
  const developerRole = await prisma.role.findFirst({ where: { name: 'developer' } });
  if (!developerRole) {
    await prisma.role.create({ data: { name: 'developer' } });
    console.log('Created role: developer');
  }

  // Link all existing users to "everyone" group
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    const alreadyInGroup = await prisma.userGroupM2M.findFirst({
      where: {
        userId: user.id,
        groupId: everyoneGroup.id,
      },
    });

    if (!alreadyInGroup) {
      await prisma.userGroupM2M.create({
        data: {
          userId: user.id,
          groupId: everyoneGroup.id,
        },
      });
      console.log(`Added user ${user.username} to everyone group`);
    }
  }

  // Assign core, inhouse, developer roles directly to user "core"
  const coreUser = await prisma.user.findUnique({ where: { username: 'core' } });
  if (coreUser) {
    const rolesToAssign = ['core', 'inhouse', 'developer'];

    for (const roleName of rolesToAssign) {
      const role = await prisma.role.findFirst({ where: { name: roleName } });
      if (role) {
        const exists = await prisma.userRole.findFirst({
          where: { userId: coreUser.id, roleId: role.id }
        });
        if (!exists) {
          await prisma.userRole.create({
            data: { userId: coreUser.id, roleId: role.id }
          });
          console.log(`Assigned role "${roleName}" to user "core"`);
        }
      }
    }
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
