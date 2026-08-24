import { z } from 'zod';

export const milestoneSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().optional(),
  done: z.boolean().optional(),
});

export const createProjectSchema = z.object({
  // Optional in the payload — the controller forces it to the requester for clients.
  clientId: z.string().optional(),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  serviceId: z.string().optional(),
  assignedTeam: z.array(z.string()).optional(),
  milestones: z.array(milestoneSchema).optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  status: z.enum(['requested', 'quoted', 'in_progress', 'in_review', 'completed', 'closed']).optional(),
  assignedTeam: z.array(z.string()).optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  contractAccepted: z.boolean().optional(),
});
