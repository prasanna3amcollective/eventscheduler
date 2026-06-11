import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

function formatParticipantNames(names: string[]) {
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
}

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

        const missingParticipants: Array<{ user: { name: string } }> = await prisma.participant.findMany({
            where: {
                activityId: activityId,
                OR: [
                    { attendance: null },
                    { attendance: { notIn: [0, 1, 2] } }
                ]
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                user: {
                    name: 'asc'
                }
            }
        });

        if (missingParticipants.length > 0) {
            const names = missingParticipants.map(p => p.user.name).filter(Boolean);
            const participantText = names.length > 0 ? formatParticipantNames(names) : `${missingParticipants.length} participant(s)`;
            return NextResponse.json(
                { error: `Cannot close activity. Please mark attendance for ${participantText} before closing.` },
                { status: 400 }
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
    } catch (error: unknown) {
        console.error("Error closing activity:", error);
        if ((error as Error).message?.includes('Security Restricted')) {
            return NextResponse.json({ error: (error as Error).message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}