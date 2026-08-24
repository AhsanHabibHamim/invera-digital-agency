'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api, API_BASE } from '@/lib/api';
import type { Message } from '@/types';

interface UseProjectChatOptions {
  projectId: string | null;
  enabled?: boolean;
}

interface PresenceEvent {
  userId: string;
  online: boolean;
}

interface TypingEvent {
  projectId: string;
  userId: string;
  name: string;
  isTyping: boolean;
}

function socketOrigin(): string {
  // API_BASE already includes /api — strip it for the socket origin.
  return API_BASE.replace(/\/api\/?$/, '');
}

/**
 * Real-time project chat over Socket.io with:
 * - JWT handshake auth (short-lived access token)
 * - per-project rooms, typing indicators, read receipts, presence
 * - graceful polling-free fallback: initial load via REST
 */
export function useProjectChat({ projectId, enabled = true }: UseProjectChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial REST load
  useEffect(() => {
    if (!projectId || !enabled) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get<Message[]>(`/messages/project/${projectId}`)
      .then((res) => {
        if (!cancelled && res.success) setMessages(res.data ?? []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectId, enabled]);

  // Socket lifecycle
  useEffect(() => {
    if (!projectId || !enabled || typeof window === 'undefined') return;

    const socket = io(socketOrigin(), {
      auth: { token: api.getAccessToken() || undefined },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('presence:online');
      socket.emit('project:join', projectId, () => {
        // joined — mark read
        socket.emit('message:read', { projectId });
      });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('message:new', (msg: Message & { projectId?: string }) => {
      if (String(msg.projectId) !== String(projectId)) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on(
      'typing:update',
      ({ userId, name, isTyping }: TypingEvent) => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          if (isTyping) next[userId] = name;
          else delete next[userId];
          return next;
        });
      },
    );

    socket.on('presence:update', ({ userId, online }: PresenceEvent) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: online }));
    });

    socket.on('message:read', () => {
      // Optimistically mark incoming messages as read locally.
      setMessages((prev) =>
        prev.map((m) => (m.isRead ? m : { ...m, isRead: true })),
      );
    });

    return () => {
      socket.emit('project:leave', projectId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, enabled]);

  const sendMessage = useCallback(
    (content: string, attachments?: string[], replyTo?: string) => {
      const socket = socketRef.current;
      if (!socket || !connected) {
        // REST fallback so messages are never silently dropped
        if (projectId && content.trim()) {
          void api
            .post<Message>(`/messages/project/${projectId}`, { content, attachments })
            .then((res) => {
              if (res.success) {
                setMessages((prev) =>
                  prev.some((m) => m._id === res.data._id) ? prev : [...prev, res.data],
                );
              }
            });
        }
        return;
      }
      socket.emit(
        'message:send',
        { projectId, content, ...(attachments?.length ? { attachments } : {}), ...(replyTo ? { replyTo } : {}) },
        (res: { ok: boolean; message?: Message }) => {
          if (res.ok && res.message) {
            setMessages((prev) =>
              prev.some((m) => m._id === res.message!._id) ? prev : [...prev, res.message!],
            );
          }
        },
      );
    },
    [projectId, connected],
  );

  const setTyping = useCallback((isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket || !projectId) return;
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    socket.emit('typing', { projectId, isTyping });
    if (isTyping) {
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing', { projectId, isTyping: false });
      }, 2500);
    }
  }, [projectId]);

  return { messages, sendMessage, setTyping, typingUsers, onlineUsers, connected, loading };
}
