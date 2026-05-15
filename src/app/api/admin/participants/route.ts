import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET() {
  try {
    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

     const participants = await withAuth(securityContext, () => ({
       model: 'participant',
       operation: 'findMany',
       args: {
         include: {
           user: true,
           activity: true,
         },
         orderBy: {
           sys_created_at: 'desc',
         },
       }
     }));

    return NextResponse.json(participants);
  } catch (error: any) {
    console.error('Error fetching admin participants:', error);
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
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await withAuth(securityContext, () => ({
      model: 'participant',
      operation: 'delete',
      args: {
        where: { id }
      }
    }));

    return NextResponse.json({ message: 'Participant removed' });
  } catch (error: any) {
    console.error('Error deleting admin participant:', error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
