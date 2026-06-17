import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { roleSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET() {
  try {
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await withAuth(securityContext, () => ({
      model: 'role',
      operation: 'findMany',
      args: { orderBy: { name: 'asc' } }
    }));
    
    return NextResponse.json(roles);
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = roleSchema.parse(body);

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await withAuth(securityContext, () => ({
      model: 'role',
      operation: 'create',
      args: {
        data: { name, description },
        _context: securityContext
      }
    }));

    return NextResponse.json(role, { status: 201 });
  } catch (error: any) {
    console.error("Error creating role:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
