import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionContext();
    
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        groups: {
          include: {
            group: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId: session.id },
      include: { role: true }
    });

    const roleNames = userRoles.map((ur: any) => ur.role.name);

    return NextResponse.json({ user, roles: roleNames });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
