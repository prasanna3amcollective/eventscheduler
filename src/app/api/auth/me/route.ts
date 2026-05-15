import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
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

    // Fetch user's direct roles
    const userRoles: any[] = await withAuth(session, () => ({
      model: 'userRole',
      operation: 'findMany',
      args: {
        where: { userId: session.id },
        include: { role: true }
      }
    })) as any;

    // Fetch user's group roles
    const groupRoles: any[] = await withAuth(session, () => ({
      model: 'userGroupM2M',
      operation: 'findMany',
      args: {
        where: { userId: session.id },
        include: {
          group: {
            include: {
              roles: {
                include: { role: true }
              }
            }
          }
        }
      }
    })) as any;

    const rolesSet = new Set<string>();
    userRoles.forEach((ur: any) => rolesSet.add(ur.role.name));
    groupRoles.forEach((ug: any) => {
      ug.group.roles.forEach((gr: any) => rolesSet.add(gr.role.name));
    });

    return NextResponse.json({ user, roles: Array.from(rolesSet) });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
