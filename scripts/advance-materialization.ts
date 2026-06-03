#!/usr/bin/env tsx

/**
 * CLI entrypoint for running the daily recurrence materialization maintenance job.
 *
 * Usage:
 *   npx tsx scripts/advance-materialization.ts
 *
 * This is useful for:
 * - Local development and testing
 * - Running from a traditional external cron on the same machine as the DB
 * - Situations where you prefer not to expose an HTTP endpoint
 *
 * It uses the real "system-cron" database user for all operations (full audit trail).
 */

import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getSecurityContext } from '@/lib/auth';
import { runDailyMaterializationMaintenance } from '@/lib/recurrence/maintenance/advanceWindows';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined in .env');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔧 Starting recurrence materialization maintenance (CLI mode)\n');

  // Find the official system automation account
  const systemUser = await prisma.user.findUnique({
    where: { username: 'system-cron' },
  });

  if (!systemUser) {
    console.error('❌ system-cron user does not exist in the database.');
    console.error('   Please run: npm run seed');
    process.exit(1);
  }

  const context = await getSecurityContext(systemUser.id);

  console.log(`✅ Running as system-cron user (id=${systemUser.id})`);

  const result = await runDailyMaterializationMaintenance(prisma, context, {
    horizonDays: 45,
    gapThresholdDays: 7,
  });

  console.log('\n✅ Maintenance run completed successfully');
  console.log('Summary:', {
    horizonAdvanced: result.horizonAdvanced,
    gapsClosed: result.gapsClosed,
    totalCreated: result.totalCreated,
    totalReconciled: result.totalReconciled,
    errors: result.errors.length,
  });

  if (result.errors.length > 0) {
    console.warn('\n⚠️  Some templates had errors:');
    result.errors.forEach((e) => console.warn('  -', e));
  }

  process.exit(0);
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during maintenance run:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
