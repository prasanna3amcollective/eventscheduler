import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        type: true
        // Exclude password
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, phone, email, type, password } = body;

    // Simple sanitization - remove HTML tags to prevent XSS
    const sanitize = (str: string) => str.replace(/<[^>]*>?/gm, '');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: sanitize(name),
        username: sanitize(username),
        phone: sanitize(phone),
        email: sanitize(email),
        type: sanitize(type),
        password: hashedPassword
      }
    });

    // Stamp sys_created_by / sys_updated_by with the new user's own ID.
    // We can't do this inside the create above because the ID doesn't exist yet,
    // and there is no session context available during public registration.
    await withAuth(
      () => prisma.user.update({
        where: { id: user.id },
        data: { sys_created_by: user.id, sys_updated_by: user.id }
      }),
      { id: user.id, roles: [] }
    );

    // Set JWT Session Cookie immediately
    const token = await signToken({ sub: user.id });
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    // Don't return password in response
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username or Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
