import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { userRoleSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = await withAuth(securityContext, () => ({
      model: 'userRole',
      operation: 'findMany',
      args: {
        where: userId ? { userId } : undefined,
        include: {
          role: true,
          user: { select: { id: true, name: true, username: true } }
        }
      }
    }));
    
    return NextResponse.json(userRoles);
  } catch (error: any) {
    console.error("Error fetching user roles:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, roleId } = userRoleSchema.parse(body);

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await withAuth(securityContext, () => ({
      model: 'userRole',
      operation: 'create',
      args: {
        data: { userId, roleId },
        include: { role: true },
        _context: securityContext
      }
    }));

    return NextResponse.json(userRole, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user role:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
