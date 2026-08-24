import { api } from '@/lib/api';
import type { Expense, FinancialSummary, Income, PaginatedResponse } from '@/types';

export function getExpenses(params?: Record<string, string>) {
  return api.get<PaginatedResponse<Expense>>('/finance/expenses', params);
}

export function getExpense(id: string) {
  return api.get<Expense>(`/finance/expenses/${id}`);
}

export function createExpense(data: Partial<Expense>) {
  return api.post<Expense>('/finance/expenses', data);
}

export function updateExpense(id: string, data: Partial<Expense>) {
  return api.patch<Expense>(`/finance/expenses/${id}`, data);
}

export function deleteExpense(id: string) {
  return api.delete<null>(`/finance/expenses/${id}`);
}

export function getIncomes(params?: Record<string, string>) {
  return api.get<PaginatedResponse<Income>>('/finance/incomes', params);
}

export function getIncome(id: string) {
  return api.get<Income>(`/finance/incomes/${id}`);
}

export function createIncome(data: Partial<Income>) {
  return api.post<Income>('/finance/incomes', data);
}

export function updateIncome(id: string, data: Partial<Income>) {
  return api.patch<Income>(`/finance/incomes/${id}`, data);
}

export function deleteIncome(id: string) {
  return api.delete<null>(`/finance/incomes/${id}`);
}

export function getFinancialSummary(params?: Record<string, string>) {
  return api.get<FinancialSummary>('/finance/summary', params);
}

export function getMonthlyData(params?: Record<string, string>) {
  return api.get<{ month: string; income: number; expenses: number }[]>('/finance/monthly', params);
}

export function getFinanceCategories() {
  return api.get<{ expenseCategories: string[]; incomeSources: string[] }>('/finance/categories');
}
