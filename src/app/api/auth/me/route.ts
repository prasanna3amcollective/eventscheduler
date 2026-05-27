import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionContext();

    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await withAuth(session, () => ({
      model: 'user',
      operation: 'findUnique',
      args: {
        where: { id: session.id },
        include: {
          groups: {
            include: {
              group: true
            }
          }
        }
      }
    }));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's roles (includes both direct and group-inherited, synced automatically)
    const userRoles: any[] = await withAuth(session, () => ({
      model: 'userRole',
      operation: 'findMany',
      args: {
        where: { userId: session.id },
        include: { role: true }
      }
    })) as any;

    const roles = userRoles.map((ur: any) => ur.role.name);

    return NextResponse.json({ user, roles });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
