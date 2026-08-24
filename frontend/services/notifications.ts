import { api } from '@/lib/api';
import type { Notification } from '@/types';

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function getNotifications(params?: Record<string, string>) {
  return api.get<NotificationsResponse>('/notifications', params);
}

export function readAllNotifications() {
  return api.patch<null>('/notifications/read-all');
}

export function readNotification(id: string) {
  return api.patch<null>(`/notifications/${id}/read`);
}
