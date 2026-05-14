import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseId = id.split('_inst_')[0];

    const event = await withAuth(() => prisma.event.findUnique({
      where: { id: baseId },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    }), securityContext);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("Error fetching event:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, leader, guide, observer, startDateTime, endDateTime, duration, isRecurring, recurrenceRule } = body;

    const securityContext = await getSessionContext();
    const baseId = id.split('_inst_')[0];

    // First, get the current event to see what leader/guide/observer values existed before
    const currentEvent = await withAuth(() => prisma.event.findUnique({
      where: { id: baseId },
      select: { leader: true, guide: true, observer: true }
    }), securityContext) as { leader: string; guide: string; observer: string } | null;

    const event = await withAuth(() => (prisma as any).event.update({
      where: { id: baseId },
      data: {
        name,
        leader,
        guide,
        observer,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        duration: Number(duration),
        isRecurring: Boolean(isRecurring),
        recurrenceRule: isRecurring ? recurrenceRule : null,
      },
      _context: securityContext
    }), securityContext);

    // Update participant records based on leader/guide/observer changes
    try {
      // Get current staff names from the updated event
      const newStaffNames = [leader, guide, observer].filter(Boolean);
      
      // Get previous staff names from the current event before update
      const prevStaffNames = currentEvent ? 
        [currentEvent.leader, currentEvent.guide, currentEvent.observer].filter(Boolean) : 
        [];

      // Find users for new staff names (select only id for efficiency)
      const newStaffUsers = await prisma.user.findMany({
        where: { name: { in: newStaffNames } },
        select: { id: true }
      });

      // Find users for previous staff names (select only id for efficiency)
      const prevStaffUsers = await prisma.user.findMany({
        where: { name: { in: prevStaffNames } },
        select: { id: true }
      });

      // Determine which users to remove (were in prev but not in new)
      const prevStaffUserIds = new Set(prevStaffUsers.map((u: { id: string }) => u.id));
      const newStaffUserIds = new Set(newStaffUsers.map((u: { id: string }) => u.id));
      const userIdsToRemove = [...prevStaffUserIds].filter(id => !newStaffUserIds.has(id));

      // Determine which users to add (are in new but not in prev)
      const userIdsToAdd = [...newStaffUserIds].filter(id => !prevStaffUserIds.has(id));

      // Remove participants for users no longer in leader/guide/observer
      if (userIdsToRemove.length > 0) {
        await prisma.participant.deleteMany({
          where: {
            eventId: baseId,
            userId: { in: userIdsToRemove }
          }
        });
      }

      // Add participants for newly added leader/guide/observer
      if (userIdsToAdd.length > 0) {
        await prisma.participant.createMany({
          data: Array.from(userIdsToAdd).map(userId => ({
            eventId: baseId,
            userId
          })),
          skipDuplicates: true
        });
      }
    } catch (participantError) {
      console.error("Error updating participant records:", participantError);
      // Don't fail the whole request if participant update fails
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("Error updating event:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const securityContext = await getSessionContext();

    if (!securityContext) {
      return NextResponse.json({ error: 'Session expired or missing. Please log in again.' }, { status: 401 });
    }

    const baseId = id.split('_inst_')[0];

    await withAuth(() => (prisma as any).event.delete({
      where: { id: baseId },
      _context: securityContext
    }), securityContext);

    return NextResponse.json({ message: 'Event deleted' });
  } catch (error: any) {
    console.error("Error deleting event:", error);

    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'An error occurred during deletion: ' + error.message }, { status: 500 });
  }
}
