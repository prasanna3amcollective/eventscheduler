import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AsyncLocalStorage } from 'async_hooks';
import 'dotenv/config';

const globalForPrisma = globalThis as unknown as { prisma: any; userContextStorage: AsyncLocalStorage<any> };

// AsyncLocalStorage gives us request-scoped context without polluting Prisma args
export const userContextStorage = globalForPrisma.userContextStorage || new AsyncLocalStorage<{ id: string; roles: string[] }>();
if (process.env.NODE_ENV !== 'production') globalForPrisma.userContextStorage = userContextStorage;

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Get user context (Try AsyncLocalStorage first, then args fallback)
          const userContext = userContextStorage.getStore() || (args as any)._context;

          // Clean up the custom context arg so it doesn't hit the DB
          if ((args as any)._context) {
            const { _context, ...cleanArgs } = args as any;
            args = cleanArgs;
          }

          // 2. ACL BYPASS for internal/junction tables (no ACL rows exist for these)
          // NOTE: System column stamping still runs below for ALL tables.
          const aclBypassTables = ['AccessControlList', 'Role', 'UserRole', 'UserGroupM2M', 'RoleGroupM2M', 'Participant', 'RecurrenceTemplate', 'User', 'Group', 'Testimonial'];
          const skipAcl = aclBypassTables.includes(model);

          if (!skipAcl) {
            // 3. OPERATION MAPPING
            const opMap: Record<string, string> = {
              findMany: 'read', findUnique: 'read', findFirst: 'read',
              create: 'create', update: 'write', delete: 'delete', upsert: 'write',
            };

            const aclOp = opMap[operation];
            if (aclOp) {
              // 4. ACL ENFORCEMENT
              const acls = await client.accessControlList.findMany({
                where: {
                  table: model.toLowerCase(),
                  operation: aclOp
                }
              });

              if (acls.length > 0) {
                if (!userContext) {
                  if ((model === 'User' && (aclOp === 'create' || aclOp === 'read')) ||
                    ((model === 'Activity' || model === 'Responsibility') && aclOp === 'read')) {
                    // Public reads for activities/responsibilities (landing page, calendar, detail views).
                    // Also public user registration/login. Matches documented policy that "read is open when no ACL".
                    // Internal system-cron automation supplies _context when it needs to read.
                  } else {
                    throw new Error(`Security Restricted: No user context provided for ${model}.${aclOp}`);
                  }
                } else {
                  const aclRoleIds = acls.map(acl => acl.roleId);
                  const userRoleIds = userContext.roles;
                  console.log(`[ACL DIAG] ${model}.${aclOp} | user=${userContext.id} | userRoles=[${userRoleIds.join(',')}] | aclRequiredRoles=[${aclRoleIds.join(',')}]`);
                  const hasRole = acls.some(acl => userRoleIds.includes(acl.roleId));
                  if (!hasRole) {
                    console.error(`[ACL DIAG] BLOCKED: no role match for ${model}.${aclOp}`);
                    throw new Error(`Security Restricted: User does not have the required role for ${model}.${aclOp}`);
                  }
                }
              }
            }
          }

          // 5. BUSINESS RULE: SYSTEM COLUMNS (applies to ALL tables, including junction tables)
          if (userContext && (operation === 'create' || operation === 'update')) {
            const argsWithData = args as any;
            if (argsWithData.data) {
              if (operation === 'create') argsWithData.data.sys_created_by = userContext.id;
              argsWithData.data.sys_updated_by = userContext.id;
            }
          }

          return query(args);
        }
      },
      // AUTOMATED ROLE SYNC
      userGroupM2M: {
        async create({ args, query }) {
          const result = await query(args);
          // @ts-ignore
          if (result.userId) await syncUserRoles(result.userId, client);
          return result;
        },
        async delete({ args, query }) {
          const record = await client.userGroupM2M.findUnique({ where: args.where });
          const result = await query(args);
          if (record) await syncUserRoles(record.userId, client);
          return result;
        }
      },
      // Sync user roles when roles are assigned/removed from groups
      roleGroupM2M: {
        async create({ args, query }) {
          const result = await query(args);
          const groupMembers = await client.userGroupM2M.findMany({
            where: { groupId: result.groupId },
            select: { userId: true }
          });
          await Promise.all(groupMembers.map((m: any) => syncUserRoles(m.userId, client)));
          return result;
        },
        async delete({ args, query }) {
          const record = await client.roleGroupM2M.findUnique({ where: args.where });
          const result = await query(args);
          if (record) {
            const groupMembers = await client.userGroupM2M.findMany({
              where: { groupId: record.groupId },
              select: { userId: true }
            });
            await Promise.all(groupMembers.map((m: any) => syncUserRoles(m.userId, client)));
          }
          return result;
        }
      }
    }
  });
};

async function syncUserRoles(userId: string, p: any) {
  try {
    const groups = await p.userGroupM2M.findMany({
      where: { userId },
      include: { group: { include: { roles: true } } }
    });

    // Get roles inherited from groups
    const groupRoleIds = groups.flatMap((g: any) =>
      g.group.roles.map((r: any) => r.roleId)
    );

    // Get existing direct role assignments (to preserve them)
    const directRoles = await p.userRole.findMany({
      where: { userId },
      select: { roleId: true }
    });
    const directRoleIds = directRoles.map((r: any) => r.roleId);

    // Merge both sets
    const allRoleIds = Array.from(new Set([...groupRoleIds, ...directRoleIds]));

    await p.$transaction([
      p.userRole.deleteMany({ where: { userId } }),
      p.userRole.createMany({
        data: allRoleIds.map(roleId => ({ userId, roleId }))
      })
    ]);
  } catch (error) {
    console.error("Error syncing user roles:", error);
    throw error;
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export function withAuth<T>(
  user: { id: string; roles: string[] } | undefined,
  fn: () => T
): Promise<T> {
  const raw: any = fn();

  // If the callback returned a Prisma descriptor { model, operation, args },
  // execute the actual Prisma query with the user context injected via _context.
  // We inject _context instead of relying on AsyncLocalStorage because the Prisma
  // extended client ($allOperations) runs in a different async context.
  if (raw && typeof raw === 'object' && raw.model && raw.operation && raw.args !== undefined) {
    // Prisma model names are capitalized (e.g., "User", "Role") while descriptors
    // use lowercase (e.g., "user", "role"). Capitalize the first letter.
    let modelName = raw.model as string;
    modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

    const op = raw.operation as string;
    const args = raw.args;
    const prismaModel = (prisma as any)[modelName];
    if (prismaModel && typeof prismaModel[op] === 'function') {
      const finalArgs = user ? { ...args, _context: user } : args;
      return prismaModel[op](finalArgs) as Promise<T>;
    }
  }

  return (raw as any) as Promise<T>;
}
