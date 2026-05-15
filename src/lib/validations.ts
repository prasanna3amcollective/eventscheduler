import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

export const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits')
});

export const activitySchema = z.object({
  name: z.string().min(1, 'Activity name is required').max(200),
  leader: z.array(z.string()).default([]),
  guide: z.array(z.string()).default([]),
  observer: z.array(z.string()).default([]),
  startDateTime: z.string().datetime({ message: "Invalid start date format" }),
  endDateTime: z.string().datetime({ message: "Invalid end date format" }),
  duration: z.number().positive(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().nullable().optional(),
  category: z.string().default('General'),
  state: z.enum(['Scheduled', 'Completed']).default('Scheduled').optional()
});

export const checkOverlapSchema = z.object({
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().nullable().optional(),
  duration: z.number().positive(),
  excludeActivityId: z.string().optional()
});

export const groupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(100),
  description: z.string().max(500).default(''),
  category: z.string().max(50).default('Default')
});

export const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').max(50),
  description: z.string().max(500).default('')
});

export const aclSchema = z.object({
  table: z.string().min(1, 'Table name is required'),
  operation: z.enum(['read', 'write', 'create', 'delete']),
  roleId: z.string().uuid('Invalid Role ID'),
  description: z.string().optional().nullable()
});

export const groupMemberSchema = z.object({
  userId: z.string().uuid('Invalid User ID'),
  groupId: z.string().uuid('Invalid Group ID')
});

export const groupRoleSchema = z.object({
  roleId: z.string().uuid('Invalid Role ID'),
  groupId: z.string().uuid('Invalid Group ID')
});

export const userRoleSchema = z.object({
  userId: z.string().uuid('Invalid User ID'),
  roleId: z.string().uuid('Invalid Role ID')
});
