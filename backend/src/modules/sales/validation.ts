import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createPipelineSchema = z.object({
  name: z.string().min(2).max(100),
  stages: z.array(z.object({
    name: z.string().min(1),
    order: z.number().min(0),
    color: z.string().optional(),
  })).min(1),
});

export const updatePipelineSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  stages: z.array(z.object({
    name: z.string().min(1),
    order: z.number().min(0),
    color: z.string().optional(),
  })).optional(),
  isActive: z.boolean().optional(),
});

export const createTargetSchema = z.object({
  userId: objectId,
  targetAmount: z.number().min(0),
  currency: z.enum(['USD', 'BDT', 'EUR', 'GBP']).optional(),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string(),
  endDate: z.string(),
  achievedAmount: z.number().optional(),
  notes: z.string().optional(),
});

export const updateTargetSchema = createTargetSchema.partial();

export const createCommissionSchema = z.object({
  userId: objectId,
  dealId: z.string().optional(),
  dealName: z.string().min(2),
  dealValue: z.number().min(0),
  commissionRate: z.number().min(0).max(100),
  commissionAmount: z.number().min(0),
  currency: z.enum(['USD', 'BDT', 'EUR', 'GBP']).optional(),
  notes: z.string().optional(),
});
