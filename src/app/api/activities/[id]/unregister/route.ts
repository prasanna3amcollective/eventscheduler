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

    // Delete the participant record
     await withAuth(securityContext, () => ({
       model: 'participant',
       operation: 'deleteMany',
       args: {
         where: {
           activityId: originalEventId,
           userId: securityContext.id
         }
       }
     }));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Unregister error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
