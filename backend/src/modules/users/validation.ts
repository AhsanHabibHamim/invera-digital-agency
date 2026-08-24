import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100).optional(),
  role: z.enum(['super_admin', 'admin', 'team']).default('team'),
  phone: z.string().optional(),
  company: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['super_admin', 'admin', 'team']).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});
