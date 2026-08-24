import { z } from 'zod';

export const createTaskSchema = z.object({
  projectId: z.string(),
  sprintId: z.string().optional(),
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  type: z.enum(['task', 'bug', 'issue', 'feature']).optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  estimatedHours: z.number().optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
  parentTask: z.string().optional(),
  order: z.number().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  type: z.enum(['task', 'bug', 'issue', 'feature']).optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().nullable().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  dueDate: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  order: z.number().optional(),
});

export const subtaskSchema = z.object({
  title: z.string().min(1),
  assignedTo: z.string().optional(),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  done: z.boolean().optional(),
  assignedTo: z.string().nullable().optional(),
});

export const createSprintSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  goal: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['planning', 'active', 'completed', 'cancelled']).optional(),
});

export const updateSprintSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  goal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'cancelled']).optional(),
});

export const timeEntrySchema = z.object({
  taskId: z.string(),
  projectId: z.string(),
  description: z.string().optional(),
  hours: z.number().positive().max(24),
  date: z.string(),
  billable: z.boolean().optional(),
});
