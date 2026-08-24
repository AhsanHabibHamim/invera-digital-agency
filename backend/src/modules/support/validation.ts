import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(2),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  category: z.string().min(2),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['open', 'in_progress', 'waiting_on_client', 'resolved', 'closed']).optional(),
  tags: z.array(z.string()).optional(),
});

export const replySchema = z.object({
  message: z.string().min(1),
  attachments: z.array(z.string()).optional(),
});

export const assignTicketSchema = z.object({
  userId: z.string(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
