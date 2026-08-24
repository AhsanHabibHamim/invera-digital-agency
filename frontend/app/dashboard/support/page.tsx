'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import DashboardStats from '@/components/dashboard/DashboardStats';
import Badge from '@/components/ui/Badge';
import * as supportService from '@/services/support';
import * as usersService from '@/services/users';
import type { SupportTicket, SupportCategory, TicketReply, User } from '@/types';
import {
  TicketCheck, AlertCircle, Loader2, Plus, X, Trash2, Send, Search, ChevronDown,
} from 'lucide-react';

type Tab = 'tickets' | 'categories';

const priorityBadge: Record<string, string> = {
  urgent: 'badge-destructive', high: 'badge-warning', medium: 'badge-info', low: 'badge',
};

const statusBadge: Record<string, string> = {
  open: 'badge-destructive', in_progress: 'badge-warning', waiting_on_client: 'badge-info', resolved: 'badge-success', closed: 'badge',
};

export default function SupportPage() {
  const [tab, setTab] = useState<Tab>('tickets');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage support tickets and categories</p>
      </div>
      <TicketStatsCards />
      <div className="flex gap-1 border-b border-border">
        {(['tickets', 'categories'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'tickets' && <TicketsTab />}
      {tab === 'categories' && <CategoriesTab />}
    </div>
  );
}

function TicketStatsCards() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    supportService.getTicketStats().then((res) => {
      if (res.success) setStats(res.data);
    }).catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <DashboardStats
      stats={[
        { label: 'Open', value: stats.open ?? 0, icon: <AlertCircle size={18} /> },
        { label: 'In Progress', value: stats.inProgress ?? 0, icon: <Loader2 size={18} /> },
        { label: 'Waiting on Client', value: stats.waiting ?? 0, icon: <TicketCheck size={18} /> },
        { label: 'Resolved', value: stats.resolved ?? 0, icon: <TicketCheck size={18} /> },
        { label: 'Closed', value: stats.closed ?? 0, icon: <AlertCircle size={18} /> },
      ]}
    />
  );
}

function TicketsTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<{ title: string; description: string; category: string; priority: string; clientId: string; assignedTo: string }>({ title: '', description: '', category: '', priority: 'medium', clientId: '', assignedTo: '' });

  const [creating, setCreating] = useState(false);
  const [assignDropdown, setAssignDropdown] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;
      const [tRes, cRes, uRes] = await Promise.all([
        supportService.getTickets(params),
        supportService.getTicketCategories(),
        usersService.getUsers({ limit: '100' }),
      ]);
      if (tRes.success) {
        setTickets(tRes.data.tickets ?? []);
        setTotal(tRes.data.total ?? 0);
        setTotalPages(tRes.data.totalPages ?? 1);
      }
      if (cRes.success) setCategories(Array.isArray(cRes.data) ? cRes.data : []);
      if (uRes.success) setUsers(uRes.data.users ?? []);
    } catch {} finally { setLoading(false); }
  }, [page, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => { fetch(); }, [fetch]); // eslint-disable-line react-hooks/set-state-in-effect

  const userName = (value: string | { _id?: string; id?: string; name?: string } | null | undefined) => {
    if (!value) return '—';
    if (typeof value === 'object') return value.name || '—';
    return users.find((u) => u._id === value || u.id === value)?.name || value;
  };

  const handleAssign = async (ticketId: string, userId: string) => {
    await supportService.assignTicket(ticketId, { userId });
    setAssignDropdown(null);
    if (selectedTicket?._id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, assignedTo: userId } : null));
    }
    fetch();
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    await supportService.updateTicket(ticketId, { status } as Partial<SupportTicket>);
    setSelectedTicket(null);
    fetch();
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setReplying(true);
    try {
      await supportService.replyToTicket(selectedTicket._id, { message: replyText });
      setReplyText('');
      const res = await supportService.getTicket(selectedTicket._id);
      if (res.success) setSelectedTicket(res.data);
    } finally { setReplying(false); }
  };

  const columns: Column<SupportTicket>[] = [
    { key: 'ticketNumber', label: 'Ticket #', render: (t) => <span className="font-mono text-sm font-medium">{t.ticketNumber}</span> },
    { key: 'title', label: 'Title', sortable: true, render: (t) => <span className="font-medium text-foreground">{t.title}</span> },
    { key: 'clientId', label: 'Client', render: (t) => t.clientId ? <span className="text-sm">{userName(t.clientId)}</span> : <span className="text-foreground/40">—</span> },
    { key: 'category', label: 'Category', render: (t) => <Badge>{t.category}</Badge> },
    {
      key: 'priority', label: 'Priority', render: (t) => (
        <span className={`badge ${priorityBadge[t.priority] || 'badge'}`}>{t.priority}</span>
      ),
    },
    {
      key: 'status', label: 'Status', render: (t) => (
        <span className={`badge ${statusBadge[t.status] || 'badge'}`}>{t.status.replace(/_/g, ' ')}</span>
      ),
    },
    { key: 'assignedTo', label: 'Assigned', render: (t) => t.assignedTo ? userName(t.assignedTo) : <span className="text-foreground/40">—</span> },
    { key: 'createdAt', label: 'Created', sortable: true, render: (t) => new Date(t.createdAt).toLocaleDateString() },
    {
      key: 'actions', label: '', render: (t) => (
        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }}>
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input className="input pl-9" placeholder="Search tickets..." value={search} onChange={(e) => { setSearch(e.target.value); }} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="open">Open</option><option value="in_progress">In Progress</option>
          <option value="waiting_on_client">Waiting on Client</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
        </select>
        <select className="input w-auto" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
          <option value="">All Priority</option>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
        </select>
        <select className="input w-auto" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c.slug || c.name}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary btn-md" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Ticket</button>
      </div>

      <DataTable
        columns={columns}
        data={search
          ? tickets.filter((t) => {
              const q = search.toLowerCase();
              return (
                (t.title ?? '').toLowerCase().includes(q) ||
                (t.ticketNumber ?? '').toLowerCase().includes(q) ||
                (typeof t.clientId === 'object' && t.clientId?.name?.toLowerCase().includes(q))
              );
            })
          : tickets}
        total={search ? tickets.filter((t) => {
          const q = search.toLowerCase();
          return (
            (t.title ?? '').toLowerCase().includes(q) ||
            (t.ticketNumber ?? '').toLowerCase().includes(q) ||
            (typeof t.clientId === 'object' && t.clientId?.name?.toLowerCase().includes(q))
          );
        }).length : total}
        page={search ? 1 : page}
        totalPages={search ? 1 : totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No tickets found"
        keyExtractor={(t) => t._id}
      />

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          users={users}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={handleStatusChange}
          onAssign={handleAssign}
          replyText={replyText}
          onReplyTextChange={setReplyText}
          onReply={handleReply}
          replying={replying}
        />
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Create Ticket</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="form-label">Title *</label>
                <input className="input" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Description</label>
                <textarea className="input" rows={3} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select className="input" value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}>
                  <option value="">Select...</option>
                  {categories.map((c) => <option key={c._id} value={c.slug || c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select className="input" value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="form-label">Client</label>
                <select className="input" value={createForm.clientId} onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}>
                  <option value="">Select...</option>
                  {users.filter((u) => u.role === 'client').map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Assign To</label>
                <select className="input" value={createForm.assignedTo} onChange={(e) => setCreateForm({ ...createForm, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={creating || !createForm.title} onClick={async () => {
                setCreating(true);
                try {
                  await supportService.createTicket(createForm as unknown as Partial<SupportTicket>);
                  setShowCreate(false);
                  setCreateForm({ title: '', description: '', category: '', priority: 'medium', clientId: '', assignedTo: '' });
                  fetch();
                } finally { setCreating(false); }
              }}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketDetailModal({
  ticket, users, onClose, onStatusChange, onAssign, replyText, onReplyTextChange, onReply, replying,
}: {
  ticket: SupportTicket; users: User[]; onClose: () => void; onStatusChange: (id: string, status: string) => void;
  onAssign: (id: string, userId: string) => void; replyText: string; onReplyTextChange: (v: string) => void;
  onReply: () => void; replying: boolean;
}) {
  const userName = (id: string | { _id?: string; name?: string; email?: string; company?: string }) =>
    typeof id === 'string' ? (users.find((u) => u._id === id || u.id === id)?.name || id) : (id.name ?? '');
  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const statusOptions = ['open', 'in_progress', 'waiting_on_client', 'resolved', 'closed'];
  const priorityBadgeMap: Record<string, string> = { urgent: 'badge-destructive', high: 'badge-warning', medium: 'badge-info', low: 'badge' };
  const statusBadgeMap: Record<string, string> = { open: 'badge-destructive', in_progress: 'badge-warning', waiting_on_client: 'badge-info', resolved: 'badge-success', closed: 'badge' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">{ticket.ticketNumber}: {ticket.title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div><span className="text-foreground/50">Status:</span>
            <div className="relative inline-block ml-1">
              <button className={`badge ${statusBadgeMap[ticket.status]} cursor-pointer`} onClick={() => setStatusOpen(!statusOpen)}>
                {ticket.status.replace(/_/g, ' ')} <ChevronDown className="w-3 h-3 ml-1 inline" />
              </button>
              {statusOpen && (
                <div className="dropdown mt-1" style={{ position: 'absolute', zIndex: 50 }}>
                  {statusOptions.map((s) => (
                    <button key={s} className="dropdown-item" onClick={() => { onStatusChange(ticket._id, s); setStatusOpen(false); }}>
                      <span className={`badge ${statusBadgeMap[s]}`}>{s.replace(/_/g, ' ')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div><span className="text-foreground/50">Priority:</span>
            <span className={`badge ${priorityBadgeMap[ticket.priority]} ml-1`}>{ticket.priority}</span>
          </div>
          <div><span className="text-foreground/50">Category:</span> <Badge>{ticket.category}</Badge></div>
          <div><span className="text-foreground/50">Assigned:</span>
            <div className="relative inline-block ml-1">
              <button className="btn btn-ghost btn-sm text-xs" onClick={() => setAssignOpen(!assignOpen)}>
                {ticket.assignedTo ? userName(ticket.assignedTo) : 'Unassigned'} <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {assignOpen && (
                <div className="dropdown mt-1" style={{ position: 'absolute', zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
                  <button className="dropdown-item" onClick={() => { onAssign(ticket._id, ''); setAssignOpen(false); }}>Unassigned</button>
                  {users.map((u) => (
                    <button key={u._id} className="dropdown-item" onClick={() => { onAssign(ticket._id, u._id); setAssignOpen(false); }}>
                      {u.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div><span className="text-foreground/50">Client:</span> {ticket.clientId ? userName(ticket.clientId) : <span className="text-foreground/40">—</span>}</div>
          <div><span className="text-foreground/50">Created:</span> {new Date(ticket.createdAt).toLocaleString()}</div>
        </div>

        <div className="border-t border-border pt-4 mb-4">
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {ticket.replies && ticket.replies.length > 0 && (
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            <h3 className="text-sm font-semibold text-foreground">Replies ({ticket.replies.length})</h3>
            {ticket.replies.map((r: TicketReply, i: number) => (
              <div key={i} className="p-3 bg-foreground/5 rounded-lg">
                <div className="flex items-center justify-between text-xs text-foreground/50 mb-1">
                  <span className="font-medium text-foreground/70">{userName(r.createdBy)}</span>
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm">{r.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-4">
          <textarea
            className="input w-full mb-2"
            rows={3}
            placeholder="Type your reply..."
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
          />
          <div className="flex justify-end">
            <button className="btn btn-primary btn-md" disabled={replying || !replyText.trim()} onClick={onReply}>
              {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="ml-2">Send Reply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SupportCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supportService.getTicketCategories();
      if (res.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = res.data as any;
        setCategories(d.data ?? d.items ?? d ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]); // eslint-disable-line react-hooks/set-state-in-effect

  const openEdit = (c: SupportCategory) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '' });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await supportService.updateTicketCategory(editing._id, form);
      } else {
        await supportService.createTicketCategory({ ...form, slug: form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') });
      }
      setShowModal(false);
      fetch();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    await supportService.deleteTicketCategory(id);
    fetch();
  };

  const handleToggleActive = async (c: SupportCategory) => {
    await supportService.updateTicketCategory(c._id, { isActive: !c.isActive });
    fetch();
  };

  const columns: Column<SupportCategory>[] = [
    { key: 'name', label: 'Name', sortable: true, render: (c) => <span className="font-medium text-foreground">{c.name}</span> },
    { key: 'slug', label: 'Slug', render: (c) => <span className="font-mono text-sm text-foreground/60">{c.slug}</span> },
    {
      key: 'isActive', label: 'Active', render: (c) => (
        <span className={`badge ${c.isActive ? 'badge-success' : 'badge'}`}>{c.isActive ? 'Yes' : 'No'}</span>
      ),
    },
    {
      key: 'actions', label: 'Actions', render: (c) => (
        <div className="flex gap-1">
          <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); openEdit(c); }}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleToggleActive(c); }}>
            {c.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button className="btn btn-ghost btn-icon text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(c._id); }}><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn btn-primary btn-md" onClick={openCreate}><Plus className="w-4 h-4" /> Add Category</button>
      </div>
      <DataTable
        columns={columns}
        data={categories}
        total={categories.length}
        page={1}
        totalPages={1}
        onPageChange={() => {}}
        isLoading={loading}
        emptyMessage="No categories found"
        keyExtractor={(c) => c._id}
      />
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Name *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={submitting || !form.name.trim()} onClick={handleSave}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
