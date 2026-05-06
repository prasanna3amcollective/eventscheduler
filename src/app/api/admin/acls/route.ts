import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET() {
  try {
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const acls = await withAuth(
      () => prisma.accessControlList.findMany({
        include: { role: true },
        orderBy: { table: 'asc' }
      }),
      securityContext
    );

    return NextResponse.json(acls);
  } catch (error: any) {
    console.error("Error fetching ACLs:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, operation, roleId, description } = body;

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const acl = await withAuth(
      () => prisma.accessControlList.create({
        data: { table, operation, roleId, description },
        include: { role: true }
      }),
      securityContext
    );

    return NextResponse.json(acl, { status: 201 });
  } catch (error: any) {
    console.error("Error creating ACL:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}