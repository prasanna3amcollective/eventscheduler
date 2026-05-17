import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const securityContext = await getSessionContext();
        if (!securityContext) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const responsibility = await withAuth(securityContext, () => ({
          model: 'responsibility',
          operation: 'update',
          args: {
            where: { id },
            data: { state: 'Completed' },
            _context: securityContext
          }
        }));

        return NextResponse.json(responsibility);
    } catch (error: any) {
        console.error("Error completing responsibility:", error);
        if (error.message?.includes('Security Restricted')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}