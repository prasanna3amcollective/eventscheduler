import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
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

    const registration = await withAuth(() => prisma.participant.create({
      data: {
        eventId: id,
        userId: securityContext.id
      }
    }), securityContext);

    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You are already registered for this event' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
