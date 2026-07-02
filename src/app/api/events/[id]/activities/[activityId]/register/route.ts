import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/prisma';
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

    const registration = await withAuth(securityContext, () => ({
      model: 'eventParticipant',
      operation: 'create',
      args: {
        data: {
          eventActivityId: activityId,
          userId: securityContext.id,
          // type: "Participant", attendance: null
        }
      }
    }));

    return NextResponse.json(registration, { status: 201 });
  } catch (error: unknown) {
    console.error("Registration error:", error);
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'You are already registered for this activity' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
