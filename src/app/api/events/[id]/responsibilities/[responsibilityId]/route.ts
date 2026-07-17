import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; responsibilityId: string }> }
) {
    try {
        const { responsibilityId } = await params;
        const securityContext = await getSessionContext();

        const responsibility = await withAuth(securityContext, () => ({
            model: 'eventResponsibility',
            operation: 'findUnique',
            args: {
                where: { id: responsibilityId },
            }
        }));

        if (!responsibility) {
            return NextResponse.json({ error: 'Event responsibility not found' }, { status: 404 });
        }

        return NextResponse.json(responsibility);
    } catch (error: any) {
        console.error("Error fetching event responsibility:", error);
        if (error.message?.includes('Security Restricted')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; responsibilityId: string }> }
) {
    try {
        const { responsibilityId } = await params;
        const securityContext = await getSessionContext();
        if (!securityContext) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, startDateTime, endDateTime, duration, category, state, owner, ownerId } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (startDateTime !== undefined) updateData.startDateTime = new Date(startDateTime);
        if (endDateTime !== undefined) updateData.endDateTime = new Date(endDateTime);
        if (duration !== undefined) updateData.duration = Number(duration);
        if (category !== undefined) updateData.category = category;
        if (state !== undefined) updateData.state = state;
        if (owner !== undefined) updateData.owner = owner;
        if (ownerId !== undefined) updateData.ownerId = ownerId;
        updateData.sys_updated_by = securityContext.id;

        const updated = await withAuth(securityContext, () => ({
            model: 'eventResponsibility',
            operation: 'update',
            args: {
                where: { id: responsibilityId },
                data: updateData,
            }
        }));

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating event responsibility:", error);
        if (error.message?.includes('Security Restricted')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}