'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as messagesService from '@/services/messages';
import * as projectsService from '@/services/projects';
import { useProjectChat } from '@/hooks/useProjectChat';
import type { Message, Project } from '@/types';
import {
  MessageSquare, Send, Clock, ChevronRight, Loader2, ArrowLeft, CheckCheck,
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

export default function ClientMessagesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
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
    setError('');
    try {
      const res = await projectsService.getProjects({ limit: '100' });
      if (res.success) setProjects(res.data.projects ?? []);
    } catch {
      // handled
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]); // eslint-disable-line react-hooks/set-state-in-effect

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

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedProject) return;
    setError('');
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

  const isOwnMessage = (msg: Message): boolean => getSenderId(msg) === currentUserId;

  const typingNames = Object.values(typingUsers).filter((n) => n !== user?.name);

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
    <div className="flex h-full flex-col gap-md lg:gap-lg">
      <div>
        <h1 className="text-h3 font-bold text-foreground">Messages</h1>
        <p className="mt-4xs text-body-small text-foreground/50">Project conversations with the team</p>
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      <div className="flex flex-1 gap-lg min-h-0">
        <div
          className={`${showMobileList ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 shrink-0 flex-col`}
        >
          <div className="card-dashboard flex flex-1 flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-sm">
              <h2 className="text-h5 font-semibold text-foreground">Projects</h2>
              <MessageSquare className="w-sm h-sm text-foreground/50" />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 -mx-xs px-xs">
              {projectsLoading ? (
                <div className="flex flex-col gap-xs">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-xs p-xs rounded-lg">
                      <div className="skeleton w-md h-md rounded-full shrink-0" />
                      <div className="flex-1 space-y-xs">
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
                  <p className="empty-state-desc">You can start messaging once your project begins.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4xs">
                  {projects.map((project) => {
                    const isActive = selectedProject?._id === project._id;
                    return (
                      <button
                        key={project._id}
                        onClick={() => handleSelectProject(project)}
                        className={`flex w-full items-center gap-xs rounded-lg px-xs py-2xs text-left transition-all duration-150 ${
                          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-surface text-foreground'
                        }`}
                      >
                        <div className={`avatar avatar-sm ${getStatusColor(project.status)}`}>
                          {project.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-small font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {project.title}
                          </p>
                          <p className="text-caption text-foreground/50 truncate capitalize">
                            {project.status.replace(/_/g, ' ')}
                          </p>
                        </div>
                        {unreadByProject[project._id] ? (
                          <span className="badge badge-accent shrink-0">
                            {unreadByProject[project._id]}
                          </span>
                        ) : null}
                        <ChevronRight className={`w-sm h-sm shrink-0 ${isActive ? 'text-primary' : 'text-foreground/30'}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`${!showMobileList ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-h-0`}>
          {selectedProject ? (
            <div className="card-dashboard flex flex-1 flex-col min-h-0 overflow-hidden">
              <div className="flex items-center gap-xs pb-sm border-b border-border shrink-0">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="icon-btn lg:hidden"
                  aria-label="Back to projects"
                >
                  <ArrowLeft className="w-sm h-sm" />
                </button>
                <div className={`avatar avatar-sm ${getStatusColor(selectedProject.status)}`}>
                  {selectedProject.title.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-foreground truncate">{selectedProject.title}</p>
                  <p className="text-caption text-foreground/50 capitalize">
                    {selectedProject.status.replace(/_/g, ' ')}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-4xs text-caption font-medium ${chatConnected ? 'text-success' : 'text-foreground/40'}`}
                  title={chatConnected ? 'Real-time connected' : 'Reconnecting…'}
                >
                  <span className={`h-3xs w-3xs rounded-full ${chatConnected ? 'bg-success' : 'bg-warning'}`} />
                  {chatConnected ? 'Live' : 'Connecting'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto py-sm -mx-xs px-xs flex flex-col gap-xs">
                {messagesLoading ? (
                  <div className="loading-state">
                    <Loader2 className="w-md h-md animate-spin text-primary" />
                    <p className="text-body-small text-foreground/50">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-state">
                    <MessageSquare className="empty-state-icon" />
                    <p className="empty-state-title">No messages yet</p>
                    <p className="empty-state-desc">Start the conversation by sending a message below.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const own = isOwnMessage(msg);
                    return (
                      <div key={msg._id} className={`flex gap-xs ${own ? 'flex-row-reverse' : ''}`}>
                        <div className={`avatar avatar-sm shrink-0 ${own ? 'bg-primary' : 'bg-accent'}`}>
                          {own ? (user?.name?.charAt(0) ?? 'Y') : getSenderLetter(msg)}
                        </div>
                        <div className={`max-w-[75%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div
                            className={`rounded-xl px-sm py-2xs text-body-small leading-relaxed ${
                              own
                                ? 'bg-primary text-primary-foreground rounded-tr-md'
                                : 'bg-surface text-foreground rounded-tl-md border border-border'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-xs mt-4xs ${own ? 'flex-row-reverse' : ''}`}>
                            <span className="text-caption text-foreground/50">{own ? 'You' : getSenderName(msg)}</span>
                            <Clock className="w-3xs h-3xs text-foreground/50" />
                            <span className="text-caption text-foreground/50">{formatTimestamp(msg.createdAt)}</span>
                            {own && msg.isRead && (
                              <span className="text-caption text-success inline-flex items-center gap-4xs">
                                <CheckCheck className="w-3xs h-3xs" />
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
                <div className="px-xs pb-2xs text-caption text-foreground/50" aria-live="polite">
                  {typingNames.length === 1
                    ? `${typingNames[0]} is typing…`
                    : `${typingNames.join(', ')} are typing…`}
                </div>
              )}

              <div className="pt-sm border-t border-border shrink-0">
                <div className="flex gap-xs">
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
                    <Send className="w-sm h-sm" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-dashboard flex flex-1 items-center justify-center min-h-0">
              <div className="empty-state">
                <MessageSquare className="empty-state-icon" />
                <p className="empty-state-title">Select a project</p>
                <p className="empty-state-desc">Choose a project from the left panel to view its messages.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
