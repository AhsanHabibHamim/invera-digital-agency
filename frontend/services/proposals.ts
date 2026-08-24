import { api } from '@/lib/api';
import type { Proposal } from '@/types';

export interface PaginatedProposals {
  proposals: Proposal[];
  total: number;
  page: number;
  totalPages: number;
}

export function getProposals(params?: Record<string, string>) {
  return api.get<PaginatedProposals>('/proposals', params);
}

export function getProposal(id: string) {
  return api.get<Proposal>(`/proposals/${id}`);
}

export function createProposal(data: Partial<Proposal>) {
  return api.post<Proposal>('/proposals', data);
}

export function updateProposal(id: string, data: Partial<Proposal>) {
  return api.patch<Proposal>(`/proposals/${id}`, data);
}

export function deleteProposal(id: string) {
  return api.delete<null>(`/proposals/${id}`);
}

export function reviewProposal(id: string, data: { adminNotes?: string; status: 'under_review' | 'quoted' | 'declined' }) {
  return api.patch<Proposal>(`/proposals/${id}/review`, data);
}

export function approveProposal(id: string, data?: { adminNotes?: string }) {
  return api.post<Proposal>(`/proposals/${id}/approve`, data);
}

export function acceptProposalQuote(id: string) {
  return api.post<Proposal>(`/proposals/${id}/accept-quote`);
}

export function requestProposalChanges(id: string, data: { clientResponseNotes: string }) {
  return api.post<Proposal>(`/proposals/${id}/request-changes`, data);
}
