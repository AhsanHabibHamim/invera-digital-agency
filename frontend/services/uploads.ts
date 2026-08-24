import { api } from '@/lib/api';
import type { FileRecord } from '@/types';

export function uploadFile(formData: FormData) {
  return api.post<FileRecord>('/uploads', formData, { 'Content-Type': 'multipart/form-data' });
}

export function getProjectFiles(projectId: string) {
  return api.get<FileRecord[]>(`/uploads/${projectId}`);
}
