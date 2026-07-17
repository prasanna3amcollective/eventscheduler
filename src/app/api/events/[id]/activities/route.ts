import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await context.params;
    const body = await request.json();
    const { name, description, startDateTime, endDateTime, duration, category } = body;

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newActivity = await withAuth(securityContext, () => ({
      model: 'eventActivity',
      operation: 'create',
      args: {
        data: {
          name,
          description,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          category: category || 'General',
          eventId: eventId,
          sys_created_by: securityContext.id
        }
      }
    }));

    return NextResponse.json(newActivity);
  } catch (error: any) {
    console.error("Error creating event activity:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
