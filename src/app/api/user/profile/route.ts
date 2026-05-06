import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await withAuth(async () => {
      return await prisma.user.update({
        where: { id: securityContext.id },
        data: { name, email, phone },
      });
    }, securityContext);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: user.type,
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}