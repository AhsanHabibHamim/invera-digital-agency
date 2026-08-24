import { api } from '@/lib/api';
import type { IBudgetOption } from '@/types/pricing';

export function getBudgetOptions(params?: Record<string, string>) {
  return api.get<IBudgetOption[]>('/budget-options/admin', params);
}

export function getBudgetOption(id: string) {
  return api.get<IBudgetOption>(`/budget-options/${id}`);
}

export function createBudgetOption(data: Partial<IBudgetOption>) {
  return api.post<IBudgetOption>('/budget-options', data);
}

export function updateBudgetOption(id: string, data: Partial<IBudgetOption>) {
  return api.patch<IBudgetOption>(`/budget-options/${id}`, data);
}

export function deleteBudgetOption(id: string) {
  return api.delete<null>(`/budget-options/${id}`);
}

export function toggleBudgetOption(id: string) {
  return api.patch<IBudgetOption>(`/budget-options/${id}/toggle`);
}

export function reorderBudgetOptions(ids: string[]) {
  return api.post<IBudgetOption[]>('/budget-options/reorder', { ids });
}
