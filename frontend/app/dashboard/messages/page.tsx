'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as messagesService from '@/services/messages';
import * as projectsService from '@/services/projects';
import { useProjectChat } from '@/hooks/useProjectChat';
import type { Message, Project, PaginatedResponse } from '@/types';
import {
  MessageSquare, Send, Clock, ChevronRight,
  Loader2, ArrowLeft, CheckCheck,
} from 'lucide-react';

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getSenderId(msg: Message): string {
  if (typeof msg.senderId === 'string') return msg.senderId;
  return msg.senderId?._id ?? '';
}

function getSenderName(msg: Message): string {
  if (typeof msg.senderId === 'object' && msg.senderId?.name) return msg.senderId.name;
  return 'Team';
}

function getSenderLetter(msg: Message): string {
  return getSenderName(msg).charAt(0).toUpperCase();
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [unreadByProject, setUnreadByProject] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time chat over Socket.io (initial load via REST inside the hook).
  const {
    messages,
    sendMessage,
    setTyping,
    typingUsers,
    connected: chatConnected,
    loading: messagesLoading,
  } = useProjectChat({ projectId: selectedProject?._id ?? null });

  const currentUserId = user?._id ?? user?.id ?? '';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const res = await projectsService.getProjects({ limit: '100' });
      if (res.success && res.data) {
        const inner = res.data as unknown as { data?: PaginatedResponse<Project> };
        const paginated = inner.data ?? (res.data as unknown as PaginatedResponse<Project>);
        const items = paginated.projects ?? paginated.data ?? paginated.items ?? [];
        setProjects(items as Project[]);
      }
    } catch {
      // handled
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchProjects]);

  const loadUnreadCounts = useCallback(async () => {
    try {
      const res = await messagesService.getUnreadCounts();
      if (res.success && Array.isArray(res.data)) {
        const map: Record<string, number> = {};
        res.data.forEach((c) => {
          map[c.projectId] = c.unread;
        });
        setUnreadByProject(map);
      }
    } catch {
      // handled
    }
  }, []);

  const handleSelectProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setShowMobileList(false);
    void loadUnreadCounts();
  }, [loadUnreadCounts]);

  useEffect(() => {
    if (selectedProject) {
      void messagesService.markProjectRead(selectedProject._id).catch(() => {});
      setUnreadByProject((prev) => ({ ...prev, [selectedProject._id]: 0 }));
    }
  }, [selectedProject, messages.length]);

  useEffect(() => {
    void loadUnreadCounts(); // eslint-disable-line react-hooks/set-state-in-effect
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadUnreadCounts();
    }, 30000);
    return () => window.clearInterval(id);
  }, [loadUnreadCounts]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedProject) return;
    sendMessage(newMessage.trim());
    setNewMessage('');
    setTyping(false);
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (value.trim()) setTyping(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOwnMessage = (msg: Message): boolean =>
    getSenderId(msg) === currentUserId;

  const typingNames = Object.values(typingUsers).filter((n) => n !== user?.name);

  const getOtherAvatarLetter = (project: Project): string =>
    project.title.charAt(0).toUpperCase();

  const getStatusColor = (status: Project['status']): string => {
    const colors: Record<string, string> = {
      requested: 'bg-info',
      quoted: 'bg-primary',
      in_progress: 'bg-accent',
      in_review: 'bg-warning',
      completed: 'bg-success',
      closed: 'bg-neutral-500',
    };
    return colors[status] ?? 'bg-neutral-500';
  };

  return (
    <div className="flex h-full flex-col gap-0 lg:gap-6">
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-sm text-neutral-500">Project conversations</p>
      </div>

      <div className="flex flex-1 gap-0 lg:gap-6 min-h-0">
        {/* ---------- LEFT PANEL ---------- */}
        <div
          className={`${
            showMobileList ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-80 shrink-0 flex-col`}
        >
          <div className="card-dashboard flex flex-1 flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Projects</h2>
              <MessageSquare className="w-4 h-4 text-neutral-500" />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 -mx-3 px-3">
              {projectsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                      <div className="skeleton w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-3/4" />
                        <div className="skeleton h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare className="empty-state-icon" />
                  <p className="empty-state-title">No projects yet</p>
                  <p className="empty-state-desc">
                    You need to be assigned to a project to start messaging.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {projects.map((project) => {
                    const isActive = selectedProject?._id === project._id;
                    const statusColor = getStatusColor(project.status);
                    return (
                      <button
                        key={project._id}
                        onClick={() => handleSelectProject(project)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-surface text-foreground'
                        }`}
                      >
                        <div className={`avatar avatar-sm ${statusColor}`}>
                          {getOtherAvatarLetter(project)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isActive ? 'text-primary' : 'text-foreground'
                          }`}>
                            {project.title}
                          </p>
                          <p className="text-xs text-neutral-500 truncate capitalize">
                            {project.status.replace(/_/g, ' ')}
                          </p>
                        </div>
                        {unreadByProject[project._id] ? (
                          <span className="badge badge-accent shrink-0">
                            {unreadByProject[project._id]}
                          </span>
                        ) : null}
                        <ChevronRight className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-primary' : 'text-neutral-600'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- RIGHT PANEL ---------- */}
        <div
          className={`${
            !showMobileList ? 'flex' : 'hidden'
          } lg:flex flex-1 flex-col min-h-0`}
        >
          {selectedProject ? (
            <div className="card-dashboard flex flex-1 flex-col min-h-0 overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
                <button
                  onClick={() => {
                    setShowMobileList(true);
                  }}
                  className="icon-btn lg:hidden"
                  aria-label="Back to projects"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className={`avatar avatar-sm ${getStatusColor(selectedProject.status)}`}>
                  {getOtherAvatarLetter(selectedProject)}
                </div>
<div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {selectedProject.title}
                    </p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {selectedProject.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${chatConnected ? 'text-success' : 'text-neutral-400'}`}
                    title={chatConnected ? 'Real-time connected' : 'Reconnecting…'}
                  >
                    <span className={`h-2 w-2 rounded-full ${chatConnected ? 'bg-success' : 'bg-warning'}`} />
                    {chatConnected ? 'Live' : 'Connecting'}
                  </span>
                </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto py-4 -mx-3 px-3 space-y-3">
                {messagesLoading ? (
                  <div className="loading-state">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-sm text-neutral-500">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-state">
                    <MessageSquare className="empty-state-icon" />
                    <p className="empty-state-title">No messages yet</p>
                    <p className="empty-state-desc">
                      Start the conversation by sending a message below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const own = isOwnMessage(msg);
                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-3 ${own ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`avatar avatar-sm shrink-0 ${
                          own ? 'bg-primary' : 'bg-accent'
                        }`}>
                          {own
                            ? (user?.name?.charAt(0) ?? 'Y')
                            : getSenderLetter(msg)}
                        </div>
                        <div className={`max-w-[75%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div
                            className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                              own
                                ? 'bg-primary text-primary-foreground rounded-tr-md'
                                : 'bg-surface text-foreground rounded-tl-md border border-border'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1.5 mt-1 ${
                            own ? 'flex-row-reverse' : ''
                          }`}>
                            <span className="text-[10px] text-neutral-500">
                              {own ? 'You' : getSenderName(msg)}
                            </span>
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <span className="text-[10px] text-neutral-500">
                              {formatTimestamp(msg.createdAt)}
                            </span>
                            {own && msg.isRead && (
                              <span className="text-[10px] font-medium text-success inline-flex items-center gap-1">
                                <CheckCheck className="w-3.5 h-3.5" />
                                Seen
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {typingNames.length > 0 && (
                <div className="px-3 pb-1 text-xs text-neutral-500" aria-live="polite">
                  {typingNames.length === 1
                    ? `${typingNames[0]} is typing…`
                    : `${typingNames.join(', ')} are typing…`}
                </div>
              )}

              {/* Input area */}
              <div className="pt-4 border-t border-border shrink-0">
                <div className="flex gap-3">
                  <textarea
                    className="input min-h-[2.75rem] max-h-32 resize-none"
                    rows={1}
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    className="btn btn-primary btn-md shrink-0"
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-dashboard flex flex-1 items-center justify-center min-h-0">
              <div className="empty-state">
                <MessageSquare className="empty-state-icon" />
                <p className="empty-state-title">Select a project</p>
                <p className="empty-state-desc">
                  Choose a project from the left panel to view its messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
