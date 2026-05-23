import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const activityId = id; // real UUID post-PHASE 6 flag flip

        const securityContext = await getSessionContext();
        if (!securityContext) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the current user is a leader of this activity
        const participant = await prisma.participant.findFirst({
            where: {
                activityId: activityId,
                userId: securityContext.id,
                type: 'Leader'
            }
        });

        if (!participant) {
            return NextResponse.json(
                { error: 'Only activity leaders can close activities' },
                { status: 403 }
            );
        }

        const activity = await withAuth(securityContext, () => ({
          model: 'activity',
          operation: 'update',
          args: {
            where: { id: activityId },
            data: { state: 'Completed' },
            _context: securityContext
          }
        }));

        return NextResponse.json(activity);
    } catch (error: any) {
        console.error("Error closing activity:", error);
        if (error.message?.includes('Security Restricted')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}