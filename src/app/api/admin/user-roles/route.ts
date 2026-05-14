import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = await withAuth(
      () => prisma.userRole.findMany({
        where: userId ? { userId } : undefined,
        include: {
          role: true,
          user: { select: { id: true, name: true, username: true } }
        }
      }),
      securityContext
    );
    
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
    const { userId, roleId } = body;

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = await withAuth(
      () => (prisma as any).userRole.create({
        data: { userId, roleId },
        include: { role: true },
        _context: securityContext
      }),
      securityContext
    );

    return NextResponse.json(userRole, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user role:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
