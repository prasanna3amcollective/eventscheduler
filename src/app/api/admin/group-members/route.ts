import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  try {
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const members = await withAuth(
      () => prisma.userGroupM2M.findMany({
        where: groupId ? { groupId } : undefined,
        include: {
          user: { select: { id: true, name: true, username: true, type: true } },
          group: { select: { id: true, name: true, category: true } }
        },
        orderBy: { sys_created_at: 'desc' }
      }),
      securityContext
    );
    
    return NextResponse.json(members);
  } catch (error: any) {
    console.error("Error fetching group members:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, groupId } = body;

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await withAuth(
      () => (prisma as any).userGroupM2M.create({
        data: { userId, groupId },
        include: {
          user: { select: { id: true, name: true, username: true } },
          group: { select: { id: true, name: true } }
        },
        _context: securityContext
      }),
      securityContext
    );

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error("Error adding group member:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 400 });
    }
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await withAuth(
      () => prisma.userGroupM2M.delete({ where: { id } }),
      securityContext
    );

    return NextResponse.json({ message: 'Member removed from group' });
  } catch (error: any) {
    console.error("Error removing group member:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
