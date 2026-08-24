import { z } from 'zod';

export const createExpenseSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  amount: z.number().min(0),
  currency: z.enum(['USD', 'BDT', 'EUR', 'GBP']).optional(),
  category: z.string().min(2),
  paidBy: z.string().optional(),
  projectId: z.string().optional(),
  receiptUrl: z.string().optional(),
  expenseDate: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  notes: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
  currency: z.enum(['USD', 'BDT', 'EUR', 'GBP']).optional(),
  category: z.string().min(2).optional(),
  projectId: z.string().optional(),
  receiptUrl: z.string().optional(),
  expenseDate: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  notes: z.string().optional(),
});

export const createIncomeSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  amount: z.number().min(0),
  currency: z.enum(['USD', 'BDT', 'EUR', 'GBP']).optional(),
  category: z.string().min(2),
  source: z.string().min(2),
  clientId: z.string().optional(),
  invoiceId: z.string().optional(),
  projectId: z.string().optional(),
  incomeDate: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  notes: z.string().optional(),
});

export const updateIncomeSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
  currency: z.enum(['USD', 'BDT', 'EUR', 'GBP']).optional(),
  category: z.string().min(2).optional(),
  source: z.string().min(2).optional(),
  clientId: z.string().optional(),
  invoiceId: z.string().optional(),
  projectId: z.string().optional(),
  incomeDate: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  notes: z.string().optional(),
});
