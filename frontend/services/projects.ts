import { api } from '@/lib/api';
import type { Milestone, PaginatedResponse, Project } from '@/types';

export function getProjects(params?: Record<string, string>) {
  return api.get<PaginatedResponse<Project>>('/projects', params);
}

export function getProject(id: string) {
  return api.get<Project>(`/projects/${id}`);
}

export function createProject(data: Partial<Project>) {
  return api.post<Project>('/projects', data);
}

export function updateProject(id: string, data: Partial<Project>) {
  return api.patch<Project>(`/projects/${id}`, data);
}

export function addMilestone(id: string, data: { title: string; dueDate?: string }) {
  return api.post<Project>(`/projects/${id}/milestones`, data);
}

export function updateMilestone(id: string, milestoneId: string, data: Partial<Milestone>) {
  return api.patch<Project>(`/projects/${id}/milestones/${milestoneId}`, data);
}

export function assignTeam(id: string, data: { teamMemberIds: string[] }) {
  return api.patch<Project>(`/projects/${id}/assign-team`, data);
}

export function acceptContract(id: string) {
  return api.post<Project>(`/projects/${id}/accept-contract`);
}

export function requestRevision(id: string, data: { milestoneId: string; revisionNotes?: string }) {
  return api.post<Project>(`/projects/${id}/request-revision`, data);
}

export function archiveProject(id: string) {
  return api.patch<Project>(`/projects/${id}/archive`);
}
