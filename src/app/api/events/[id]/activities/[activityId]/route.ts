import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; activityId: string }> }
) {
    try {
        const { activityId } = await params;
        const securityContext = await getSessionContext();

        const activity = await withAuth(securityContext, () => ({
            model: 'eventActivity',
            operation: 'findUnique',
            args: {
                where: { id: activityId },
                include: {
                    participants: {
                        include: { user: true }
                    }
                }
            }
        }));

        if (!activity) {
            return NextResponse.json({ error: 'Event activity not found' }, { status: 404 });
        }

        // Enrich with leader/guide/observer names
        const leaders = (activity as any).participants?.filter((p: any) => p.type === 'Leader').map((p: any) => p.user?.name).filter(Boolean) || [];
        const guides = (activity as any).participants?.filter((p: any) => p.type === 'Guide').map((p: any) => p.user?.name).filter(Boolean) || [];
        const observers = (activity as any).participants?.filter((p: any) => p.type === 'Observer').map((p: any) => p.user?.name).filter(Boolean) || [];

        const participantUserNames = new Set<string>();
        for (const p of (activity as any).participants || []) {
            if (p.user) participantUserNames.add(p.user.name);
        }
        for (const name of [...leaders, ...guides, ...observers]) {
            if (name) participantUserNames.add(name);
        }

        return NextResponse.json({
            ...activity,
            participantCount: participantUserNames.size,
            leaders,
            guides,
            observers,
            isEventActivity: true,
        });
    } catch (error: any) {
        console.error("Error fetching event activity:", error);
        if (error.message?.includes('Security Restricted')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; activityId: string }> }
) {
    try {
        const { activityId } = await params;
        const securityContext = await getSessionContext();
        if (!securityContext) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, startDateTime, endDateTime, duration, category } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (startDateTime !== undefined) updateData.startDateTime = new Date(startDateTime);
        if (endDateTime !== undefined) updateData.endDateTime = new Date(endDateTime);
        if (duration !== undefined) updateData.duration = Number(duration);
        if (category !== undefined) updateData.category = category;
        updateData.sys_updated_by = securityContext.id;

        const updated = await withAuth(securityContext, () => ({
            model: 'eventActivity',
            operation: 'update',
            args: {
                where: { id: activityId },
                data: updateData,
            }
        }));

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating event activity:", error);
        if (error.message?.includes('Security Restricted')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}