import { api } from '@/lib/api';
import type { Lead, PaginatedResponse } from '@/types';

export function createPublicLead(data: Partial<Lead>) {
  return api.post<Lead>('/leads', data);
}

export function getMyLeads() {
  return api.get<PaginatedResponse<Lead>>('/leads/my');
}

export function getLeadsByStatus(status: string, params?: Record<string, string>) {
  return api.get<PaginatedResponse<Lead>>(`/leads/status/${status}`, params);
}

export function getLeads(params?: Record<string, string>) {
  return api.get<PaginatedResponse<Lead>>('/leads', params);
}

export function getLead(id: string) {
  return api.get<Lead>(`/leads/${id}`);
}

export function updateLead(id: string, data: Partial<Lead>) {
  return api.patch<Lead>(`/leads/${id}`, data);
}

export function updateLeadStatus(id: string, data: { status: string }) {
  return api.patch<Lead>(`/leads/${id}/status`, data);
}

export function assignLead(id: string, data: { userId: string }) {
  return api.patch<Lead>(`/leads/${id}/assign`, data);
}

export function deleteLead(id: string) {
  return api.delete<null>(`/leads/${id}`);
}

export function bulkActionLeads(data: { ids: string[]; action: 'delete' | 'update'; data?: Partial<Lead> }) {
  return api.post<unknown>('/leads/bulk', data);
}

export function convertLead(id: string) {
  return api.post<{ user: { id: string; name: string; email: string; role: string }; lead: Lead }>(`/leads/${id}/convert`);
}

export function replyToLead(id: string, data: { message: string }) {
  return api.post<Lead>(`/leads/${id}/reply`, data);
}

export function addLeadCommunication(id: string, data: { type: 'call' | 'email' | 'meeting' | 'note'; content: string }) {
  return api.post<Lead>(`/leads/${id}/communication`, data);
}

export function addLeadFile(id: string, data: { fileName: string; fileUrl: string }) {
  return api.post<Lead>(`/leads/${id}/files`, data);
}
