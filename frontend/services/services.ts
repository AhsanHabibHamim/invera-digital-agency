import { api } from '@/lib/api';
import type { Service } from '@/types';

export function getPublicServices() {
  return api.get<Service[]>('/services');
}

export function getPublicService(slug: string) {
  return api.get<Service>(`/services/slug/${slug}`);
}

export function getServices(params?: Record<string, string>) {
  return api.get<Service[]>('/services', params);
}

export function getService(id: string) {
  return api.get<Service>(`/services/${id}`);
}

export function createService(data: Partial<Service>) {
  return api.post<Service>('/services', data);
}

export function updateService(id: string, data: Partial<Service>) {
  return api.patch<Service>(`/services/${id}`, data);
}

export function deleteService(id: string) {
  return api.delete<null>(`/services/${id}`);
}
