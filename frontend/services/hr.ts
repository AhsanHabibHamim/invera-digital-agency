import { api } from '@/lib/api';
import type { Attendance, HRStats, JobApplication, Leave, PaginatedResponse } from '@/types';

export function checkIn(data: { notes?: string }) {
  return api.post<Attendance>('/hr/attendance/check-in', data);
}

export function checkOut(data: { notes?: string }) {
  return api.post<Attendance>('/hr/attendance/check-out', data);
}

export function getAttendance(params?: Record<string, string>) {
  return api.get<PaginatedResponse<Attendance>>('/hr/attendance', params);
}

export function getLeaves(params?: Record<string, string>) {
  return api.get<PaginatedResponse<Leave>>('/hr/leaves', params);
}

export function createLeave(data: Partial<Leave>) {
  return api.post<Leave>('/hr/leaves', data);
}

export function approveLeave(id: string, data: { status: 'approved' | 'rejected'; notes?: string }) {
  return api.patch<Leave>(`/hr/leaves/${id}/approve`, data);
}

export function getApplications(params?: Record<string, string>) {
  return api.get<PaginatedResponse<JobApplication>>('/hr/recruitment', params);
}

export function getPublicRecruitment(params?: Record<string, string>) {
  return api.get<PaginatedResponse<JobApplication>>('/hr/recruitment/public', params);
}

export function getApplication(id: string) {
  return api.get<JobApplication>(`/hr/recruitment/${id}`);
}

export function createApplication(data: Partial<JobApplication>) {
  return api.post<JobApplication>('/hr/recruitment', data);
}

export function updateApplication(id: string, data: Partial<JobApplication>) {
  return api.patch<JobApplication>(`/hr/recruitment/${id}`, data);
}

export function deleteApplication(id: string) {
  return api.delete<null>(`/hr/recruitment/${id}`);
}

export function getHRStats() {
  return api.get<HRStats>('/hr/stats');
}
