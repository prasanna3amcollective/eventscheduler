import { prisma } from '@/lib/prisma';
import { verifyToken } from './jwt';
import { cookies } from 'next/headers';

export async function getSecurityContext(userId: string) {
  const userRoles = await (prisma as any).userRole.findMany({
    where: { userId },
    select: { roleId: true }
  });

  return {
    id: userId,
    roles: userRoles.map((ur: any) => ur.roleId)
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
