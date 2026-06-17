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

    const activityId = id; // real UUID post-PHASE 6 flag flip

    // Delete the participant record
     await withAuth(securityContext, () => ({
       model: 'participant',
       operation: 'deleteMany',
       args: {
         where: {
           activityId: activityId,
           userId: securityContext.id
         }
       }
     }));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Unregister error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
