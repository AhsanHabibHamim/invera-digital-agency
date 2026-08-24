'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { TableSkeleton } from '@/components/Skeleton';
import * as supportService from '@/services/support';
import type { SupportTicket, SupportCategory } from '@/types';
import { Plus, X, Loader2, LifeBuoy } from 'lucide-react';

const priorityBadge: Record<string, string> = {
  urgent: 'badge-destructive',
  high: 'badge-warning',
  medium: 'badge-info',
  low: 'badge',
};

const statusBadge: Record<string, string> = {
  open: 'badge-destructive',
  in_progress: 'badge-warning',
  waiting_on_client: 'badge-info',
  resolved: 'badge-success',
  closed: 'badge',
};

interface CreateTicketForm {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function ClientTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateTicketForm>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
  });
  const [createError, setCreateError] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      const [tRes, cRes] = await Promise.all([
        supportService.getTickets(params),
        supportService.getTicketCategories(),
      ]);
      if (tRes.success) {
        setTickets(tRes.data.tickets ?? tRes.data?.items ?? []);
        setTotal(tRes.data.total ?? 0);
        setTotalPages(tRes.data.totalPages ?? 1);
      } else {
        setError(tRes.message || 'Failed to load tickets');
      }
      if (cRes.success) {
        setCategories(Array.isArray(cRes.data) ? cRes.data : []);
      }
    } catch {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const payload: Record<string, string> = {
        title: form.title,
        description: form.description,
        priority: form.priority,
      };
      if (form.category) payload.category = form.category;
      const res = await supportService.createTicket(payload as Partial<SupportTicket>);
      if (res.success) {
        setShowCreate(false);
        setForm({ title: '', description: '', category: '', priority: 'medium' });
        fetchTickets();
      } else {
        setCreateError(res.message || 'Failed to create ticket');
      }
    } catch {
      setCreateError('Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<SupportTicket>[] = [
    {
      key: 'ticketNumber',
      label: 'Ticket #',
      render: (t) => <span className="font-mono text-sm font-medium">{t.ticketNumber}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (t) => <span className="font-medium text-foreground">{t.title}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (t) => <span className="badge badge-primary">{t.category}</span>,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (t) => (
        <span className={`badge ${priorityBadge[t.priority] || 'badge'}`}>{t.priority}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (t) => (
        <span className={`badge ${statusBadge[t.status] || 'badge'}`}>
          {t.status.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (t) => new Date(t.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-20',
      render: (t) => (
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => { e.stopPropagation(); router.push(`/client/tickets/${t._id}`); }}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="mt-1 text-sm text-neutral-500">Submit and track support requests</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : tickets.length === 0 && !error ? (
        <div className="card-dashboard">
          <div className="empty-state">
            <LifeBuoy className="empty-state-icon" />
            <p className="empty-state-title">No tickets found</p>
            <p className="empty-state-desc">You haven&apos;t submitted any support tickets yet.</p>
          </div>
        </div>
      ) : (
        <DataTable<SupportTicket>
          columns={columns}
          data={tickets}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          isLoading={false}
          emptyMessage="No tickets found"
          keyExtractor={(t) => t._id}
        />
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Create Support Ticket</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Title *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Brief title for your issue"
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="input"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your issue in detail"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.slug || c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select
                    className="input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as CreateTicketForm['priority'] })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
            {createError && <div className="form-alert form-alert-error mt-4">{createError}</div>}
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-md"
                disabled={creating || !form.title.trim()}
                onClick={handleCreate}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
