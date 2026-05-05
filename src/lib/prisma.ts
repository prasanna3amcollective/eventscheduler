import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

const globalForPrisma = global as unknown as { prisma: any; userContextStorage: AsyncLocalStorage<any> };

// AsyncLocalStorage gives us request-scoped context without polluting Prisma args
export const userContextStorage = globalForPrisma.userContextStorage || new AsyncLocalStorage<{ id: string; roles: string[] }>();
if (process.env.NODE_ENV !== 'production') globalForPrisma.userContextStorage = userContextStorage;

const createPrismaClient = () => {
  const client = new PrismaClient();
  
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Get user context from AsyncLocalStorage (no args pollution)
          const userContext = userContextStorage.getStore();

          // 2. SYSTEM TABLE BYPASS
          const systemTables = ['AccessControlList', 'Role', 'UserRole', 'UserGroupM2M', 'RoleGroupM2M', 'Participant'];
          if (systemTables.includes(model)) {
            return query(args);
          }

          // 3. OPERATION MAPPING
          const opMap: Record<string, string> = {
            findMany: 'read', findUnique: 'read', findFirst: 'read',
            create: 'create', update: 'write', delete: 'delete', upsert: 'write',
          };

          const aclOp = opMap[operation];
          if (!aclOp) return query(args);

          // 4. ACL ENFORCEMENT
          const acls = await client.accessControlList.findMany({
            where: {
              table: model.toLowerCase(),
              operation: aclOp
            }
          });

          if (acls.length > 0) {
            if (!userContext) {
               if (model === 'User' && aclOp === 'create') {
                  // Allow public registration
               } else {
                  throw new Error(`Security Restricted: No user context provided for ${model}.${aclOp}`);
               }
            } else {
              const hasRole = acls.some(acl => userContext.roles.includes(acl.roleId));
              if (!hasRole) {
                throw new Error(`Security Restricted: User does not have the required role for ${model}.${aclOp}`);
              }
            }
          }

          // 5. BUSINESS RULE: SYSTEM COLUMNS
          if (userContext && (operation === 'create' || operation === 'update')) {
             const data = args.data as any;
             if (data) {
               if (operation === 'create') data.sys_created_by = userContext.id;
               data.sys_updated_by = userContext.id;
             }
          }
          
          return query(args);
        }
      },
      // AUTOMATED ROLE SYNC (ServiceNow Business Rule)
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

    const roleIds = Array.from(new Set(
      groups.flatMap((g: any) => g.group.roles.map((r: any) => r.roleId))
    ));

    await p.$transaction([
      p.userRole.deleteMany({ where: { userId } }),
      p.userRole.createMany({
        data: roleIds.map(roleId => ({ userId, roleId }))
      })
    ]);
  } catch (error) {
    console.error("Error syncing user roles:", error);
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper: run a callback with user context set (replaces withAuth)
export function withAuth<T>(fn: () => Promise<T>, user: { id: string; roles: string[] } | undefined): Promise<T> {
  if (!user) return fn();
  return userContextStorage.run(user, fn);
}
