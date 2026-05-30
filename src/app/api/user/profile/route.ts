import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { userProfileSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const passwordResetSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((p) => /[A-Z]/.test(p) && /[0-9]/.test(p), 'Password must contain at least one uppercase letter and one number'),
});

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, skills } = userProfileSchema.parse(body);

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await (withAuth(securityContext, () => ({
      model: 'user',
      operation: 'update',
      args: {
        where: { id: securityContext.id },
        data: { name, email, phone, skills }
      }
    })) as any) as any;

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: user.type,
      skills: user.skills,
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = passwordResetSchema.parse(body);

    const securityContext = await getSessionContext();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await (withAuth(securityContext, () => ({
      model: 'user',
      operation: 'findUnique',
      args: { where: { id: securityContext.id } }
    })) as any) as any;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await withAuth(securityContext, () => ({
      model: 'user',
      operation: 'update',
      args: {
        where: { id: securityContext.id },
        data: { password: hashedPassword }
      }
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}