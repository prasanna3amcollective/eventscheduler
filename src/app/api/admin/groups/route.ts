import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET() {
  try {
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await withAuth(
      () => prisma.group.findMany({ orderBy: { name: 'asc' } }),
      securityContext
    );
    
    return NextResponse.json(groups);
  } catch (error: any) {
    console.error("Error fetching groups:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category } = body;

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await withAuth(
      () => prisma.group.create({ data: { name, description, category: category || 'Default' } }),
      securityContext
    );

    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    console.error("Error creating group:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
