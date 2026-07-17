import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const securityContext = await getSessionContext();
        if (!securityContext) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, startDateTime, endDateTime, eventPlace, eventLocation, state } = body;

        // Build update data dynamically — only include fields that are provided
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (startDateTime !== undefined) updateData.startDateTime = new Date(startDateTime);
        if (endDateTime !== undefined) updateData.endDateTime = new Date(endDateTime);
        if (eventPlace !== undefined) updateData.eventPlace = eventPlace;
        if (eventLocation !== undefined) updateData.eventLocation = eventLocation;
        if (state !== undefined) updateData.state = state;
        updateData.sys_updated_by = securityContext.id;

        const updatedEvent = await withAuth(securityContext, () => ({
            model: 'event',
            operation: 'update',
            args: {
                where: { id },
                data: updateData,
                include: {
                    activities: {
                        include: {
                            participants: {
                                include: { user: true }
                            }
                        }
                    },
                    responsibilities: true
                }
            }
        }));

        return NextResponse.json(updatedEvent);
    } catch (error: any) {
        console.error("Error updating event:", error);
        if (error.message?.includes('Security Restricted')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}