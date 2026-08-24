import { api } from '@/lib/api';
import type { IPricingPlan } from '@/types/pricing';

export function getPricingPlans(params?: Record<string, string>) {
  return api.get<IPricingPlan[]>('/pricing/admin', params);
}

export function getPricingPlan(id: string) {
  return api.get<IPricingPlan>(`/pricing/${id}`);
}

export function createPricingPlan(data: Partial<IPricingPlan>) {
  return api.post<IPricingPlan>('/pricing', data);
}

export function updatePricingPlan(id: string, data: Partial<IPricingPlan>) {
  return api.patch<IPricingPlan>(`/pricing/${id}`, data);
}

export function deletePricingPlan(id: string) {
  return api.delete<null>(`/pricing/${id}`);
}

export function togglePricingPlan(id: string) {
  return api.patch<IPricingPlan>(`/pricing/${id}/toggle`);
}

export function reorderPricingPlans(ids: string[]) {
  return api.post<IPricingPlan[]>('/pricing/reorder', { ids });
}
