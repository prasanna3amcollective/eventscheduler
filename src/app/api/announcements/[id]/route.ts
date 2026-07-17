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
    const { title, content, type, expiresAt } = body;

    const updatedAnnouncement = await withAuth(securityContext, () => ({
      model: 'announcement',
      operation: 'update',
      args: {
        where: { id },
        data: {
          title,
          content,
          type,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }
      }
    }));

    return NextResponse.json(updatedAnnouncement);
  } catch (error: any) {
    console.error("Error updating announcement:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
