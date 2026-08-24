import { api } from '@/lib/api';
import type { PaginatedResponse, Sprint, Task, TaskSubtask, TimeEntry } from '@/types';

export function getTasks(params?: Record<string, string>) {
  return api.get<PaginatedResponse<Task>>('/tasks', params);
}

export function getTask(id: string) {
  return api.get<Task>(`/tasks/${id}`);
}

export function createTask(data: Partial<Task>) {
  return api.post<Task>('/tasks', data);
}

export function updateTask(id: string, data: Partial<Task>) {
  return api.patch<Task>(`/tasks/${id}`, data);
}

export function deleteTask(id: string) {
  return api.delete<null>(`/tasks/${id}`);
}

export function addSubtask(id: string, data: { title: string; assignedTo?: string }) {
  return api.post<Task>(`/tasks/${id}/subtasks`, data);
}

export function updateSubtask(id: string, subtaskId: string, data: Partial<TaskSubtask>) {
  return api.patch<Task>(`/tasks/${id}/subtasks/${subtaskId}`, data);
}

export function deleteSubtask(id: string, subtaskId: string) {
  return api.delete<Task>(`/tasks/${id}/subtasks/${subtaskId}`);
}

export function getProjectSprints(projectId: string) {
  return api.get<Sprint[]>(`/tasks/sprints/project/${projectId}`);
}

export function createSprint(data: Partial<Sprint>) {
  return api.post<Sprint>('/tasks/sprints', data);
}

export function updateSprint(id: string, data: Partial<Sprint>) {
  return api.patch<Sprint>(`/tasks/sprints/${id}`, data);
}

export function deleteSprint(id: string) {
  return api.delete<null>(`/tasks/sprints/${id}`);
}

export function getTimeEntries(params?: Record<string, string>) {
  return api.get<PaginatedResponse<TimeEntry>>('/tasks/time', params);
}

export function getTimeStats(params?: Record<string, string>) {
  return api.get<{ totalHours: number; billableHours: number; totalEntries: number }>('/tasks/time/stats', params);
}

export function createTimeEntry(data: Partial<TimeEntry>) {
  return api.post<TimeEntry>('/tasks/time', data);
}

export function deleteTimeEntry(id: string) {
  return api.delete<null>(`/tasks/time/${id}`);
}
