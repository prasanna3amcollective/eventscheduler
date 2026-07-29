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
      return NextResponse.json({ error: 'Unauthorized. Please login to register.' }, { status: 401 });
    }

    const eventId = id;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const registration = await withAuth(securityContext, () => ({
      model: 'eventParticipant',
      operation: 'create',
      args: {
        data: {
          eventId: eventId,
          userId: securityContext.id,
          type: 'Participant'
        }
      }
    }));

    return NextResponse.json(registration, { status: 201 });
  } catch (error: unknown) {
    console.error("Event registration error:", error);
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'You are already registered for this event' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
