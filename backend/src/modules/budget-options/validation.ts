import { z } from 'zod';

export const createBudgetOptionSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(100),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const updateBudgetOptionSchema = createBudgetOptionSchema.partial();

export const reorderBudgetOptionsSchema = z.object({
  ids: z.array(z.string().min(1)),
});
