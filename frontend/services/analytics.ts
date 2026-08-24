import { api } from '@/lib/api';
import type { DashboardStats, TeamWorkload } from '@/types';

export function getDashboard(params?: Record<string, string>) {
  return api.get<DashboardStats>('/analytics/dashboard', params);
}

export function getTeamWorkload(params?: Record<string, string>) {
  return api.get<TeamWorkload[]>('/analytics/team-workload', params);
}
