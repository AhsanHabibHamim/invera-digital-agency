import { z } from 'zod';

export const createPermissionSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  group: z.string().min(2).max(100),
  module: z.string().min(2).max(100),
  description: z.string().optional(),
  isSystem: z.boolean().optional(),
});

export const updatePermissionSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  group: z.string().min(2).max(100).optional(),
  module: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
});
