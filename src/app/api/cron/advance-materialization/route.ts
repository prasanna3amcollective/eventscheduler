import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecurityContext } from '@/lib/auth';
import { runDailyMaterializationMaintenance } from '@/lib/recurrence/maintenance/advanceWindows';

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) {
    // In development without a secret, we allow the request (convenience)
    // In production you MUST set CRON_SECRET
    console.warn('[Cron] CRON_SECRET is not set — allowing request (dev mode only)');
    return process.env.NODE_ENV !== 'production';
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return token === CRON_SECRET;
  }

  const customHeader = request.headers.get('x-cron-secret');
  if (customHeader) {
    return customHeader === CRON_SECRET;
  }

  return false;
}

export async function GET(request: Request) {
  const start = Date.now();

  if (!isAuthorized(request)) {
    console.warn('[Cron] Unauthorized attempt to run daily materialization maintenance');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Look up the real persistent system automation user
    const systemUser = await prisma.user.findUnique({
      where: { username: 'system-cron' },
    });

    if (!systemUser) {
      console.error('[Cron] system-cron user not found in database. Run seed.');
      return NextResponse.json(
        { error: 'system-cron user not found. Run database seed.' },
        { status: 500 }
      );
    }

    const context = await getSecurityContext(systemUser.id);

    console.log('[Cron] Starting daily materialization maintenance as system-cron');

    const maintenanceResult = await runDailyMaterializationMaintenance(prisma, context, {
      horizonDays: 45,
      gapThresholdDays: 7,
    });

    const durationMs = Date.now() - start;

    console.log('[Cron] Daily maintenance finished', {
      durationMs,
      ...maintenanceResult,
    });

    return NextResponse.json({
      success: true,
      durationMs,
      ...maintenanceResult,
    });
  } catch (error: any) {
    console.error('[Cron] Fatal error during daily materialization maintenance:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Internal error',
      },
      { status: 500 }
    );
  }
}
