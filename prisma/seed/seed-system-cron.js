const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function generateStrongPassword(length = 32) {
  // Generate a cryptographically secure random password
  // Using base64 gives a good mix of characters
  return crypto.randomBytes(length).toString('base64').replace(/[+/=]/g, '').slice(0, length);
}

async function seedSystemCron() {
  console.log('\n🔐 Bootstrapping system-cron user for automated jobs...\n');

  // 1. Create or find the system-cron role
  let systemCronRole = await prisma.role.findFirst({ where: { name: 'system-cron' } });
  if (!systemCronRole) {
    systemCronRole = await prisma.role.create({
      data: {
        name: 'system-cron',
        description: 'System automation account - Used by nightly maintenance jobs (materialization, reconciliation, etc.). Do not assign to humans.'
      }
    });
    console.log('✅ Created system-cron role');
  } else {
    console.log('ℹ️  system-cron role already exists');
  }

  // 2. Generate a strong one-time password (never intended for human login)
  const rawPassword = generateStrongPassword(48);
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // 3. Create the system-cron user (idempotent)
  let systemCronUser;
  try {
    systemCronUser = await prisma.user.create({
      data: {
        name: 'System Automation',
        username: 'system-cron',
        phone: '0000000000',
        email: 'system-cron@internal.local',
        password: hashedPassword
      }
    });
    console.log('✅ Created system-cron user');
    // IMPORTANT: Print the password ONLY during initial creation.
    // This is the ONLY time it will ever be shown.
    console.log('\n⚠️  ONE-TIME PASSWORD FOR system-cron (DO NOT SHARE, DO NOT LOGIN AS HUMAN):');
    console.log(`   ${rawPassword}`);
    console.log('   This password is for automated scripts only. It has been hashed and stored.\n');
  } catch (e) {
    if (e.code === 'P2002') {
      systemCronUser = await prisma.user.findUnique({ where: { username: 'system-cron' } });
      console.log('ℹ️  system-cron user already exists (password not re-generated)');
    } else {
      throw e;
    }
  }

  // 4. Assign the system-cron role to the user (idempotent)
  try {
    await prisma.userRole.create({
      data: {
        userId: systemCronUser.id,
        roleId: systemCronRole.id
      }
    });
    console.log('✅ Assigned system-cron role to system-cron user');
  } catch (e) {
    if (e.code === 'P2002') {
      console.log('ℹ️  system-cron role already assigned to user');
    } else {
      throw e;
    }
  }

  // 5. Ensure ACLs exist for system-cron on activity and responsibility
  // We grant full operational access (create, write, delete, read) because this account
  // drives the recurrence materialization and reconciliation jobs.
  const tables = ['activity', 'responsibility'];
  const operations = ['create', 'write', 'delete', 'read'];

  for (const table of tables) {
    for (const op of operations) {
      const existing = await prisma.accessControlList.findFirst({
        where: {
          table,
          operation: op,
          roleId: systemCronRole.id
        }
      });

      if (!existing) {
        await prisma.accessControlList.create({
          data: {
            table,
            operation: op,
            roleId: systemCronRole.id,
            description: `System automation (system-cron) may ${op} ${table}s`
          }
        });
        console.log(`✅ Created ACL: ${table}.${op} → system-cron`);
      }
    }
  }

  console.log('\n✅ system-cron bootstrap complete.');
  console.log('   This account is now used by the daily materialization/reconciliation job.\n');
}

seedSystemCron()
  .catch(e => {
    console.error('❌ Error seeding system-cron:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
