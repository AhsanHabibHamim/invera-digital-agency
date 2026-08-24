import { api } from '@/lib/api';
import type { Commission, PaginatedResponse, SalesPipeline, SalesTarget, SalesStats } from '@/types';

export function getPipelines() {
  return api.get<SalesPipeline[]>('/sales/pipelines');
}

export function getPipeline(id: string) {
  return api.get<SalesPipeline>(`/sales/pipelines/${id}`);
}

export function createPipeline(data: { name: string; stages: { name: string; order: number; color?: string }[] }) {
  return api.post<SalesPipeline>('/sales/pipelines', data);
}

export function updatePipeline(id: string, data: Partial<SalesPipeline>) {
  return api.patch<SalesPipeline>(`/sales/pipelines/${id}`, data);
}

export function deletePipeline(id: string) {
  return api.delete<null>(`/sales/pipelines/${id}`);
}

export function getTargets(params?: Record<string, string>) {
  return api.get<PaginatedResponse<SalesTarget>>('/sales/targets', params);
}

export function createTarget(data: Partial<SalesTarget>) {
  return api.post<SalesTarget>('/sales/targets', data);
}

export function updateTarget(id: string, data: Partial<SalesTarget>) {
  return api.patch<SalesTarget>(`/sales/targets/${id}`, data);
}

export function deleteTarget(id: string) {
  return api.delete<null>(`/sales/targets/${id}`);
}

export function getCommissions(params?: Record<string, string>) {
  return api.get<PaginatedResponse<Commission>>('/sales/commissions', params);
}

export function approveCommission(id: string) {
  return api.patch<Commission>(`/sales/commissions/${id}/approve`);
}

export function markCommissionPaid(id: string) {
  return api.patch<Commission>(`/sales/commissions/${id}/paid`);
}

export function getSalesStats() {
  return api.get<SalesStats>('/sales/stats');
}
