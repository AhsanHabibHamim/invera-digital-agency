import { api } from '@/lib/api';
import type { ActivityLog, PaginatedResponse } from '@/types';

export function getActivityLog(params?: Record<string, string>) {
  return api.get<PaginatedResponse<ActivityLog>>('/activity-log', params);
}

export function getActivityLogs(params?: Record<string, string>) {
  return api.get<PaginatedResponse<ActivityLog>>('/activity-log', params);
}
