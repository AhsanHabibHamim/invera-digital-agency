import { z } from 'zod';

export const pricingTierSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  features: z.array(z.string()),
});

export const createServiceSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  category: z.string().min(2),
  description: z.string().min(10),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
  pricingTiers: z.array(pricingTierSchema).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();
