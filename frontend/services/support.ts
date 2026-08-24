import { api } from '@/lib/api';
import type { PaginatedResponse, SupportCategory, SupportTicket, TicketStats } from '@/types';

export function getTickets(params?: Record<string, string>) {
  return api.get<PaginatedResponse<SupportTicket>>('/support', params);
}

export function getTicket(id: string) {
  return api.get<SupportTicket>(`/support/${id}`);
}

export function createTicket(data: Partial<SupportTicket>) {
  return api.post<SupportTicket>('/support', data);
}

export function updateTicket(id: string, data: Partial<SupportTicket>) {
  return api.patch<SupportTicket>(`/support/${id}`, data);
}

export function assignTicket(id: string, data: { userId: string }) {
  return api.patch<SupportTicket>(`/support/${id}/assign`, data);
}

export function closeTicket(id: string) {
  return api.patch<SupportTicket>(`/support/${id}/close`);
}

export function replyToTicket(id: string, data: { message: string; attachments?: string[] }) {
  return api.post<SupportTicket>(`/support/${id}/reply`, data);
}

export function getTicketCategories() {
  return api.get<SupportCategory[]>('/support/categories');
}

export function getAllTicketCategories() {
  return api.get<SupportCategory[]>('/support/categories/all');
}

export function createTicketCategory(data: { name: string; slug: string; description?: string }) {
  return api.post<SupportCategory>('/support/categories', data);
}

export function updateTicketCategory(id: string, data: Partial<SupportCategory>) {
  return api.patch<SupportCategory>(`/support/categories/${id}`, data);
}

export function deleteTicketCategory(id: string) {
  return api.delete<null>(`/support/categories/${id}`);
}

export function getTicketStats() {
  return api.get<TicketStats>('/support/stats');
}
