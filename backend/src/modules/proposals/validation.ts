import { z } from 'zod';

export const createProposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  serviceCategory: z.string().optional(),
  budgetRange: z.string().optional(),
  desiredTimeline: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  serviceCategory: z.string().optional(),
  budgetRange: z.string().optional(),
  desiredTimeline: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const adminReviewSchema = z.object({
  status: z.enum(['under_review', 'quoted', 'declined']),
  adminNotes: z.string().optional(),
  declineReason: z.string().optional(),
  quoteId: z.string().optional(),
});
