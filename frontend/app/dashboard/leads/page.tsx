'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/ui/DataTable';
import * as leadsService from '@/services/leads';
import type { Lead } from '@/types';
import {
  Plus, Search, Trash2, ChevronDown, X, Loader2,
} from 'lucide-react';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

const statusBadge: Record<string, string> = {
  new: 'badge-info',
  contacted: 'badge-primary',
  qualified: 'badge-accent',
  proposal: 'badge-warning',
  negotiation: 'badge',
  won: 'badge-success',
  lost: 'badge-destructive',
};

interface LeadFormData {
  contactName: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  priority: string;
  source: string;
  estimatedDealValue: number;
  currency: string;
  expectedCloseDate: string;
  notes: string;
  website: string;
  assignedTo: string;
}

const emptyForm: LeadFormData = {
  contactName: '', email: '', phone: '', company: '',
  status: 'new', priority: 'medium', source: '',
  estimatedDealValue: 0, currency: 'USD', expectedCloseDate: '',
  notes: '', website: '', assignedTo: '',
};

export default function LeadsPage() {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<LeadFormData>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await leadsService.getLeads(params);
      if (res.success) {
        const inner = res.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        const d = inner.data ?? inner;
        const items = d.leads ?? d.data ?? d.items ?? [];
        setLeads(items as Lead[]);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleBulkDelete = async () => {
    for (const id of selected) {
      await leadsService.deleteLead(id);
    }
    setSelected(new Set());
    fetchLeads();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await leadsService.updateLeadStatus(id, { status });
    setStatusDropdown(null);
    fetchLeads();
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await leadsService.createPublicLead(form);
      setShowCreate(false);
      setForm(emptyForm);
      fetchLeads();
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((l) => l._id)));
    }
  };

  const columns: Column<Lead>[] = [
    {
      key: 'select',
      label: '',
      render: (l) => (
        <input
          type="checkbox"
          className="checkbox"
          checked={selected.has(l._id)}
          onChange={() => toggleSelect(l._id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    { key: 'leadId', label: 'Lead ID', sortable: true },
    {
      key: 'contactName',
      label: 'Contact Name',
      sortable: true,
      render: (l) => (
        <span className="font-medium text-foreground">{l.contactName}</span>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'company', label: 'Company' },
    {
      key: 'status',
      label: 'Status',
      render: (l) => (
        <div className="relative">
          <button
            className={`badge ${statusBadge[l.status] || 'badge'} cursor-pointer`}
            onClick={(e) => { e.stopPropagation(); setStatusDropdown(statusDropdown === l._id ? null : l._id); }}
          >
            {l.status} <ChevronDown className="w-3 h-3" />
          </button>
          {statusDropdown === l._id && (
            <div className="dropdown mt-1" style={{ position: 'absolute', zIndex: 50 }}>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  className="dropdown-item"
                  onClick={(e) => { e.stopPropagation(); handleStatusChange(l._id, s); }}
                >
                  <span className={`badge ${statusBadge[s]}`}>{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (l) => (
        <span className={`badge ${
          l.priority === 'urgent' ? 'badge-destructive' :
          l.priority === 'high' ? 'badge-warning' :
          l.priority === 'medium' ? 'badge-info' : ''
        }`}>
          {l.priority}
        </span>
      ),
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (l) =>
        (typeof l.assignedTo === 'string' ? l.assignedTo : l.assignedTo?.name) || (
          <span className="text-foreground/40">—</span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (l) => new Date(l.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (l) => (
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/leads/${l._id}`); }}
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
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage and track your sales leads</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="input w-auto"
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {selected.size > 0 && (
          <button className="btn btn-destructive btn-sm" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4" /> Delete ({selected.size})
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <input
          type="checkbox"
          className="checkbox"
          checked={leads.length > 0 && selected.size === leads.length}
          onChange={toggleSelectAll}
        />
        <span className="text-sm text-foreground/50">
          {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
        </span>
      </div>

      <DataTable<Lead>
        columns={columns}
        data={leads}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No leads found"
        keyExtractor={(l) => l._id}
        searchPlaceholder=""
      />

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Create Lead</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="form-label">Contact Name *</label>
                <input className="input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Company</label>
                <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Website</label>
                <input className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Source</label>
                <input className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Assigned To</label>
                <input className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Deal Value</label>
                <input className="input" type="number" value={form.estimatedDealValue} onChange={(e) => setForm({ ...form, estimatedDealValue: Number(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Currency</label>
                <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="form-label">Expected Close</label>
                <input className="input" type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Notes</label>
                <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={creating || !form.contactName || !form.email} onClick={handleCreate}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
