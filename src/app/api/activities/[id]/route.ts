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

    const activityId = id; // real UUID post-PHASE 6 flag flip (no more _inst_ parsing)

    const activity = await withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'findUnique',
      args: {
        where: { id: activityId },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      }
    }));

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Extract staff members from participants
    const leaders = (activity as any).participants.filter((p: any) => p.type === 'Leader').map((p: any) => p.user?.name).filter(Boolean);
    const guides = (activity as any).participants.filter((p: any) => p.type === 'Guide').map((p: any) => p.user?.name).filter(Boolean);
    const observers = (activity as any).participants.filter((p: any) => p.type === 'Observer').map((p: any) => p.user?.name).filter(Boolean);

    const transformedActivity = {
      ...activity,
      leaders,
      guides,
      observers,
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
    const activityId = id; // real UUID post-PHASE 6 flag flip
    const body = await request.json();
    console.log(`PUT /api/activities/${activityId} body:`, JSON.stringify(body, null, 2));
    const parsedData = activitySchema.parse(body);
    console.log(`PUT /api/activities/${activityId} parsedData:`, JSON.stringify(parsedData, null, 2));
    const { name, leader, guide, observer, startDateTime, endDateTime, duration, isRecurring, recurrenceRule, category, recurrenceTemplateId, generatedFromTemplateId, detachReason } = parsedData;

    const securityContext = await getSessionContext();

    const activity = await withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'update',
      args: {
        where: { id: activityId },
        data: {
          name,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          isRecurring: Boolean(isRecurring),
          recurrenceRule: isRecurring ? recurrenceRule : null,
          recurrenceTemplateId: recurrenceTemplateId || null,
          generatedFromTemplateId: generatedFromTemplateId || null,
          detachReason: detachReason || undefined, // preserve existing if not sent
          category: category || 'General',
        },
        _context: securityContext
      }
    }));

    // Update staff participants
    const staffRoles = [
      { names: leader, type: 'Leader' },
      { names: guide, type: 'Guide' },
      { names: observer, type: 'Observer' }
    ];

    const addedUserIds = new Set<string>();
    for (const role of staffRoles) {
      await prisma.participant.deleteMany({
        where: {
          activityId: activityId,
          type: role.type
        }
      });

      for (const name of role.names) {
        const user = await prisma.user.findFirst({
          where: { name: name }
        });
        if (user && !addedUserIds.has(user.id)) {
            await prisma.participant.create({
            data: {
              activityId: activityId,
              userId: user.id,
              type: role.type
            }
          });
          addedUserIds.add(user.id);
        }
      }
    }

    return NextResponse.json(activity);
  } catch (error: any) {
    console.error("Error updating activity FULL ERROR:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message, details: error.issues }, { status: 400 });
    }
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error', message: error.message, stack: error.stack }, { status: 500 });
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

    const activityId = id; // real UUID post-PHASE 6 flag flip

    await withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'delete',
      args: {
        where: { id: activityId },
        _context: securityContext
      }
    }));

    return NextResponse.json({ message: 'Activity deleted' });
  } catch (error: any) {
    console.error("Error deleting activity:", error);

    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'An error occurred during deletion: ' + error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = id; // real UUID post-PHASE 6 flag flip
    const { participantId, attendance, payAsYouWish } = await request.json();

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await withAuth(securityContext, () => ({
      model: 'participant',
      operation: 'update',
      args: {
        where: { id: participantId, activityId: activityId },
        data: { 
          attendance: Number(attendance),
          ...(payAsYouWish !== undefined ? { payAsYouWish: Number(payAsYouWish) } : {})
        }
      }
    }));

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating attendance:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
