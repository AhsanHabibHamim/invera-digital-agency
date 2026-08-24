import { z } from 'zod';

const lineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().min(1),
  price: z.number().min(0),
});

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createQuoteSchema = z.object({
  clientId: objectId,
  projectId: objectId.optional(),
  lineItems: z.array(lineItemSchema).min(1),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
});

export const updateQuoteSchema = createQuoteSchema.partial();

export const sendQuoteSchema = z.object({
  validUntil: z.string().optional(),
});
