import { prisma } from '@/lib/prisma';
import { verifyToken } from './jwt';
import { cookies } from 'next/headers';

export async function getSecurityContext(userId: string) {
  const userRoles = await (prisma as any).userRole.findMany({
    where: { userId },
    select: { roleId: true }
  });

  const groupRoles = await (prisma as any).userGroupM2M.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          roles: {
            select: { roleId: true }
          }
        }
      }
    }
  });

  const roles = new Set<string>();
  userRoles.forEach((ur: any) => roles.add(ur.roleId));
  groupRoles.forEach((ug: any) => {
    ug.group.roles.forEach((gr: any) => roles.add(gr.roleId));
  });

  return {
    id: userId,
    roles: Array.from(roles)
  };
}

export async function getSessionContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) return undefined;

  const payload = await verifyToken(token);
  if (!payload || !payload.sub) return undefined;

  return getSecurityContext(payload.sub);
}
