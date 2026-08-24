import { api } from '@/lib/api';
import type { Message, UnreadCount } from '@/types';

export function getConversations(params?: Record<string, string>) {
  return api.get<Message[]>('/messages', params);
}

export function getProjectMessages(projectId: string, params?: Record<string, string>) {
  return api.get<Message[]>(`/messages/${projectId}`, params);
}

export function getUnreadCounts() {
  return api.get<UnreadCount[]>('/messages/unread/counts');
}

export function markProjectRead(projectId: string) {
  return api.patch<null>(`/messages/${projectId}/read`);
}

export function sendMessage(projectId: string, data: { content: string; attachments?: string[] }) {
  return api.post<Message>(`/messages/${projectId}`, data);
}

export function replyToMessage(messageId: string, data: { content: string }) {
  return api.post<Message>(`/messages/${messageId}/reply`, data);
}
