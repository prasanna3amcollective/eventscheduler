import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id, activityId } = resolvedParams;

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await prisma.eventActivityParticipant.deleteMany({
      where: {
        eventActivityId: activityId,
        userId: securityContext.id
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Not registered for this activity' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Successfully unregistered from activity' }, { status: 200 });
  } catch (error: unknown) {
    console.error("Unregistration error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
