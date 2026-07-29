import { NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = id;

    // Delete event participant record for this user and event
    const deleted = await prisma.eventParticipant.deleteMany({
      where: {
        eventId: eventId,
        userId: securityContext.id
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Not registered for this event' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Successfully unregistered from event' }, { status: 200 });
  } catch (error: unknown) {
    console.error("Event unregistration error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
