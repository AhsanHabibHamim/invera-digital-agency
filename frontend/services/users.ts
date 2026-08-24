import { api } from '@/lib/api';
import type { PaginatedResponse, User, UserRoleDoc } from '@/types';

export function getUsers(params?: Record<string, string>) {
  return api.get<PaginatedResponse<User>>('/users', params);
}

export function getUser(id: string) {
  return api.get<User>(`/users/${id}`);
}

export function createUser(data: Partial<User> & { password: string }) {
  return api.post<User>('/users', data);
}

export function updateUser(id: string, data: Partial<User>) {
  return api.patch<User>(`/users/${id}`, data);
}

export function deactivateUser(id: string) {
  return api.patch<null>(`/users/${id}/deactivate`);
}

export function getUserRoles(id: string) {
  return api.get<UserRoleDoc[]>(`/users/${id}/roles`);
}

export function assignUserRole(id: string, data: { roleId: string }) {
  return api.post<UserRoleDoc>(`/users/${id}/roles`, data);
}

export function removeUserRole(id: string, roleId: string) {
  return api.delete<null>(`/users/${id}/roles/${roleId}`);
}
