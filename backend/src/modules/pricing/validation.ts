import { z } from 'zod';

export const createPricingPlanSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  monthly: z.number().min(0),
  yearly: z.number().min(0),
  currency: z.string().min(1).max(10).optional(),
  features: z.array(z.string()).optional(),
  badge: z.string().max(100).optional(),
  cta: z.string().min(1).max(100).optional(),
  ctaText: z.string().max(300).optional(),
  highlight: z.boolean().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const updatePricingPlanSchema = createPricingPlanSchema.partial();

export const reorderPricingPlansSchema = z.object({
  ids: z.array(z.string().min(1)),
});
