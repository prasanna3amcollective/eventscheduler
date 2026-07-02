import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const { params } = context;
    const eventId = await Promise.resolve(params.id);
    const body = await request.json();
    const { name, description, startDateTime, endDateTime, duration, category, owner, ownerId } = body;

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newResponsibility = await withAuth(securityContext, () => ({
      model: 'eventResponsibility',
      operation: 'create',
      args: {
        data: {
          name,
          description,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          category: category || 'General',
          owner: owner || securityContext.name,
          ownerId: ownerId || securityContext.id,
          eventId: eventId,
          sys_created_by: securityContext.id
        }
      }
    }));

    return NextResponse.json(newResponsibility);
  } catch (error: any) {
    console.error("Error creating event responsibility:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
