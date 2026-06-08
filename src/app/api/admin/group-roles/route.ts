import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { groupRoleSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  try {
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleAssignments = await withAuth(securityContext, () => ({
      model: 'roleGroupM2M',
      operation: 'findMany',
      args: {
        where: groupId ? { groupId } : undefined,
        include: {
          role: true,
          group: { select: { id: true, name: true } }
        },
        orderBy: { sys_created_at: 'desc' }
      }
    }));
    
    return NextResponse.json(roleAssignments);
  } catch (error: any) {
    console.error("Error fetching group roles:", error);
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roleId, groupId } = groupRoleSchema.parse(body);

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignment = await withAuth(securityContext, () => ({
      model: 'roleGroupM2M',
      operation: 'create',
      args: {
        data: { roleId, groupId },
        include: {
          role: true,
          group: { select: { id: true, name: true } }
        },
        _context: securityContext
      }
    }));

    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    console.error("Error assigning role to group:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'This role is already assigned to the group' }, { status: 400 });
    }
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
