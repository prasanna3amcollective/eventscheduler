import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { groupSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET() {
  try {
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await withAuth(securityContext, () => ({
      model: 'group',
      operation: 'findMany',
      args: { orderBy: { name: 'asc' } }
    }));
    
    return NextResponse.json(groups);
  } catch (error: any) {
    console.error("Error fetching groups:", error);
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category } = groupSchema.parse(body);

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await withAuth(securityContext, () => ({
      model: 'group',
      operation: 'create',
      args: {
        data: { name, description, category: category || 'Default' },
        _context: securityContext
      }
    }));

    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    console.error("Error creating group:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
