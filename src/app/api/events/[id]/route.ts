import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

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
