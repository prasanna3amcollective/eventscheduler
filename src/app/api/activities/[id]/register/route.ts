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

    const activityId = id; // real UUID post-PHASE 6 flag flip (no _inst_ parsing)

    const registration = await withAuth(securityContext, () => ({
      model: 'participant',
      operation: 'create',
      args: {
        data: {
          activityId: activityId,
          userId: securityContext.id
        }
      }
    }));

    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You are already registered for this activity' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
