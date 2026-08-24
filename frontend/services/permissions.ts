import { api } from '@/lib/api';
import type { Permission } from '@/types';

export function getPermissions(params?: Record<string, string>) {
  return api.get<Permission[]>('/permissions', params);
}

export function getPermissionGroups() {
  return api.get<string[]>('/permissions/groups');
}

export function getPermissionModules() {
  return api.get<string[]>('/permissions/modules');
}

export function getPermission(id: string) {
  return api.get<Permission>(`/permissions/${id}`);
}

export function createPermission(data: { name: string; group: string; module: string; description?: string }) {
  return api.post<Permission>('/permissions', data);
}

export function updatePermission(id: string, data: Partial<Permission>) {
  return api.patch<Permission>(`/permissions/${id}`, data);
}

export function deletePermission(id: string) {
  return api.delete<null>(`/permissions/${id}`);
}
