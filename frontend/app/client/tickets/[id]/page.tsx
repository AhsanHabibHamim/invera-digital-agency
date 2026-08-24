'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import * as supportService from '@/services/support';
import type { SupportTicket } from '@/types';
import {
  ArrowLeft, Loader2, LifeBuoy, Send,
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  open: 'badge-destructive',
  in_progress: 'badge-warning',
  waiting_on_client: 'badge-info',
  resolved: 'badge-success',
  closed: 'badge',
};

const priorityBadge: Record<string, string> = {
  urgent: 'badge-destructive',
  high: 'badge-warning',
  medium: 'badge-info',
  low: 'badge',
};

export default function ClientTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await supportService.getTicket(id);
      if (res.success) setTicket(res.data);
      else setError(res.message || 'Failed to load ticket');
    } catch {
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]); // eslint-disable-line react-hooks/set-state-in-effect

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.replies?.length]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !ticket) return;
    setSending(true);
    try {
      const res = await supportService.replyToTicket(ticket._id, { message: reply.trim() });
      if (res.success) {
        setReply('');
        await fetchTicket();
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="empty-state">
        <LifeBuoy className="empty-state-icon" />
        <p className="empty-state-title">{error || 'Ticket not found'}</p>
        <button className="btn btn-outline btn-md mt-sm" onClick={() => router.push('/client/tickets')}>
          Back to tickets
        </button>
      </div>
    );
  }

  const replies = ticket.replies ?? [];
  const isClosed = ['resolved', 'closed'].includes(ticket.status);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-sm">
      <div className="flex items-center gap-xs">
        <Link href="/client/tickets" className="icon-btn" aria-label="Back to tickets">
          <ArrowLeft className="w-sm h-sm" />
        </Link>
        <div className="flex min-w-0 flex-wrap items-center gap-xs">
          <h1 className="truncate text-h4 font-bold text-foreground">{ticket.title}</h1>
          <span className={`badge ${statusBadge[ticket.status] ?? ''}`}>{ticket.status.replace(/_/g, ' ')}</span>
          <span className={`badge ${priorityBadge[ticket.priority] ?? ''}`}>{ticket.priority}</span>
        </div>
      </div>

      <p className="text-caption text-foreground/50">
        #{ticket.ticketNumber} · Opened {new Date(ticket.createdAt).toLocaleString()}
      </p>

      <div className="card-dashboard flex flex-col gap-xs">
        {/* Original message */}
        <div className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-muted/60 px-sm py-2xs text-body-small">
          {ticket.description}
        </div>

        {/* Replies thread */}
        {replies.map((r, i) => {
          const author = typeof r.userId === 'object' ? r.userId : null;
          const isStaff = r.isStaffReply === true || (author?.role ? author.role !== 'client' : false);
          return (
            <div
              key={r._id ?? i}
              className={`max-w-[85%] px-sm py-2xs text-body-small ${
                isStaff
                  ? 'self-end rounded-2xl rounded-br-sm bg-primary/10 border border-primary/20'
                  : 'self-start rounded-2xl rounded-bl-sm bg-muted/60'
              }`}
            >
              <p className="mb-3xs text-caption font-semibold text-foreground/60">
                {isStaff ? `${author?.name ?? 'Support Team'} · Invera` : 'You'} ·{' '}
                {new Date(r.createdAt).toLocaleString()}
              </p>
              {r.message}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!isClosed && (
        <form onSubmit={handleReply} className="flex items-center gap-2xs">
          <input
            className="form-input flex-1"
            placeholder="Write a reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={4000}
          />
          <button type="submit" className="btn btn-primary btn-md" disabled={sending || !reply.trim()}>
            {sending ? <Loader2 className="w-sm h-sm animate-spin" /> : <Send className="w-sm h-sm" />}
            Send
          </button>
        </form>
      )}
    </div>
  );
}
