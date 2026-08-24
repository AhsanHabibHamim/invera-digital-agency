import { api } from '@/lib/api';
import type { Role, RolePermission } from '@/types';

export function getRoles(params?: Record<string, string>) {
  return api.get<Role[]>('/roles', params);
}

export function getRole(id: string) {
  return api.get<Role>(`/roles/${id}`);
}

export function createRole(data: { name: string; slug: string; description?: string }) {
  return api.post<Role>('/roles', data);
}

export function updateRole(id: string, data: Partial<Role>) {
  return api.patch<Role>(`/roles/${id}`, data);
}

export function deleteRole(id: string) {
  return api.delete<null>(`/roles/${id}`);
}

export function cloneRole(id: string, data: { name: string; slug: string }) {
  return api.post<Role>(`/roles/${id}/clone`, data);
}

export function getRolePermissions(id: string) {
  return api.get<RolePermission[]>(`/roles/${id}/permissions`);
}

export function assignRolePermission(id: string, data: { permissionId: string }) {
  return api.post<RolePermission>(`/roles/${id}/permissions`, data);
}

export function removeRolePermission(id: string, permissionId: string) {
  return api.delete<null>(`/roles/${id}/permissions/${permissionId}`);
}
