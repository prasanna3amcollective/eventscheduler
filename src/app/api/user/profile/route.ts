import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { userProfileSchema } from '@/lib/validations';
import { z } from 'zod';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone } = userProfileSchema.parse(body);

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await (withAuth(securityContext, () => ({
      model: 'user',
      operation: 'update',
      args: {
        where: { id: securityContext.id },
        data: { name, email, phone }
      }
    })) as any) as any;

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: user.type,
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}