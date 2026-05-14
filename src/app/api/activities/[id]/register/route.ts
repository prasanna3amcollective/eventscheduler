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

    // Determine the true activity ID. Recurring activities have composite IDs like "originalId_inst_timestamp"
    const originalEventId = id.includes('_inst_') ? id.split('_inst_')[0] : id;

    const registration = await withAuth(() => prisma.participant.create({
      data: {
        activityId: originalEventId,
        userId: securityContext.id
      }
    }), securityContext);

    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You are already registered for this activity' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
