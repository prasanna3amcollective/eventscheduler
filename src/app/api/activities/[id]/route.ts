import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { activitySchema } from '@/lib/validations';
import { z } from 'zod';

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

    const activity = await withAuth(() => prisma.activity.findUnique({
      where: { id: baseId },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    }), securityContext);

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Extract staff members from participants
    const leaderRecord = (activity as any).participants.find((p: any) => p.type === 'Leader');
    const guideRecord = (activity as any).participants.find((p: any) => p.type === 'Guide');
    const observerRecord = (activity as any).participants.find((p: any) => p.type === 'Observer');

    const transformedActivity = {
      ...activity,
      leader: leaderRecord?.user?.name || null,
      guide: guideRecord?.user?.name || null,
      observer: observerRecord?.user?.name || null,
    };

    return NextResponse.json(transformedActivity);
  } catch (error: any) {
    console.error("Error fetching activity:", error);
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
    const parsedData = activitySchema.parse(body);
    const { name, leader, guide, observer, startDateTime, endDateTime, duration, isRecurring, recurrenceRule, category } = parsedData;

    const securityContext = await getSessionContext();
    const baseId = id.split('_inst_')[0];

    const activity = await withAuth(async () => {
      const updated = await (prisma as any).activity.update({
        where: { id: baseId },
        data: {
          name,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          isRecurring: Boolean(isRecurring),
          recurrenceRule: isRecurring ? recurrenceRule : null,
          category: category || 'General',
        },
        _context: securityContext
      });

      // Update staff participants
      const staff = [
        { name: leader, type: 'Leader' },
        { name: guide, type: 'Guide' },
        { name: observer, type: 'Observer' }
      ];

      for (const s of staff) {
        // Delete existing participant of this type for this activity
        await prisma.participant.deleteMany({
          where: {
            activityId: baseId,
            type: s.type
          }
        });

        // If a name was provided, find the user and create a new participant record
        if (s.name) {
          const user = await prisma.user.findFirst({
            where: { name: s.name }
          });
          if (user) {
            await prisma.participant.create({
              data: {
                activityId: baseId,
                userId: user.id,
                type: s.type
              }
            });
          }
        }
      }

      return updated;
    }, securityContext);

    return NextResponse.json(activity);
  } catch (error: any) {
    console.error("Error updating activity:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
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

    await withAuth(() => (prisma as any).activity.delete({
      where: { id: baseId },
      _context: securityContext
    }), securityContext);

    return NextResponse.json({ message: 'Activity deleted' });
  } catch (error: any) {
    console.error("Error deleting activity:", error);

    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'An error occurred during deletion: ' + error.message }, { status: 500 });
  }
}
