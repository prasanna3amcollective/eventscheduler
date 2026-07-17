import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const securityContext = await getSessionContext();
    
    const now = new Date();

    // Fetch announcements that haven't expired yet
    const announcements = await withAuth(securityContext, () => ({
      model: 'announcement',
      operation: 'findMany',
      args: {
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }
          ]
        },
        orderBy: { publishAt: 'desc' }
      }
    }));

    return NextResponse.json(announcements);
  } catch (error: any) {
    console.error("Error fetching announcements:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const securityContext = await getSessionContext();
    
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, type, expiresAt } = body;

    const newAnnouncement = await withAuth(securityContext, () => ({
      model: 'announcement',
      operation: 'create',
      args: {
        data: {
          title,
          content,
          type: type || 'General Info',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          publishAt: new Date(),
        }
      }
    }));

    return NextResponse.json(newAnnouncement);
  } catch (error: any) {
    console.error("Error creating announcement:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
