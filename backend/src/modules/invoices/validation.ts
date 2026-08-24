import { z } from 'zod';

const lineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().min(1),
  price: z.number().min(0),
});

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createInvoiceSchema = z.object({
  clientId: objectId,
  projectId: objectId.optional(),
  quoteId: objectId.optional(),
  lineItems: z.array(lineItemSchema).min(1),
  discountCode: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  currency: z.enum(['USD', 'BDT']).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const sendInvoiceSchema = z.object({
  dueDate: z.string().optional(),
});
