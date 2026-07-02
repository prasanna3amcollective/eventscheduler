import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const securityContext = await getSessionContext();
    
    // Fetch events with their activities and responsibilities
    const events = await withAuth(securityContext, () => ({
      model: 'event',
      operation: 'findMany',
      args: {
        include: {
          activities: {
            include: {
              participants: {
                include: { user: true }
              }
            }
          },
          responsibilities: true
        },
        orderBy: { startDateTime: 'asc' }
      }
    }));

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("Error fetching events:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const securityContext = await getSessionContext();
    
    // Only users with developer or relevant roles might be able to create events, 
    // or we just rely on standard auth for now.
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, startDateTime, endDateTime, eventPlace, eventLocation } = body;

    const newEvent = await withAuth(securityContext, () => ({
      model: 'event',
      operation: 'create',
      args: {
        data: {
          name,
          description,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          eventPlace,
          eventLocation,
          sys_created_by: securityContext.id
        }
      }
    }));

    return NextResponse.json(newEvent);
  } catch (error: any) {
    console.error("Error creating event:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
