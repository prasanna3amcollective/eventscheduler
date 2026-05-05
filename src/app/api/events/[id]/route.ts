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

    const event = await withAuth(() => prisma.event.update({
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
      }
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
    const baseId = id.split('_inst_')[0];

    await withAuth(() => prisma.event.delete({
      where: { id: baseId }
    }), securityContext);

    return NextResponse.json({ message: 'Event deleted' });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
