import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSessionContext();

    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupName } = await request.json();

    if (!groupName) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const group = await prisma.group.findFirst({
      where: { name: groupName }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if already in group
    const existing = await prisma.userGroupM2M.findFirst({
      where: {
        userId: session.id,
        groupId: group.id
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already in group' });
    }

    await prisma.userGroupM2M.create({
      data: {
        userId: session.id,
        groupId: group.id,
        sys_created_by: session.id,
        sys_updated_by: session.id
      }
    });

    return NextResponse.json({ success: true, message: 'Joined group' });
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
