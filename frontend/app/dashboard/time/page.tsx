'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import * as tasksService from '@/services/tasks';
import type { TimeEntry } from '@/types';
import { Plus, Search, X, Loader2, Trash2 } from 'lucide-react';

interface TimeEntryForm {
  taskId: string;
  userId: string;
  projectId: string;
  hours: number;
  date: string;
  description: string;
  billable: boolean;
}

const emptyForm: TimeEntryForm = {
  taskId: '',
  userId: '',
  projectId: '',
  hours: 0,
  date: new Date().toISOString().split('T')[0],
  description: '',
  billable: true,
};

export default function TimePage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<TimeEntryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      const res = await tasksService.getTimeEntries(params);
      if (res.success) {
        const inner = res.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        const d = inner.data ?? inner;
        const items = d.entries ?? d.timeEntries ?? d.data ?? d.items ?? [];
        setEntries(items as TimeEntry[]);
        setTotal(d.total ?? items.length ?? 0);
        setTotalPages(d.totalPages ?? 1);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleCreate = async () => {
    if (!form.hours || !form.date) return;
    if (form.hours <= 0 || form.hours > 24) return; // reject zero/negative/absurd hours
    setSaving(true);
    try {
      await tasksService.createTimeEntry(form);
      setShowModal(false);
      setForm(emptyForm);
      fetchEntries();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tasksService.deleteTimeEntry(id);
      setConfirmDelete(null);
      fetchEntries();
    } catch {
      // handled
    }
  };

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  const columns: Column<TimeEntry>[] = [
    {
      key: 'userId',
      label: 'User',
      render: (e) =>
        (typeof e.userId === 'string' ? e.userId : e.userId?.name) || <span className="text-foreground/40">—</span>,
    },
    {
      key: 'taskId',
      label: 'Task',
      render: (e) =>
        (typeof e.taskId === 'string' ? e.taskId : e.taskId?.title) || <span className="text-foreground/40">—</span>,
    },
    {
      key: 'projectId',
      label: 'Project',
      render: (e) =>
        (typeof e.projectId === 'string' ? e.projectId : e.projectId?.title) || <span className="text-foreground/40">—</span>,
    },
    {
      key: 'hours',
      label: 'Hours',
      sortable: true,
      render: (e) => <span className="font-medium">{e.hours}h</span>,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (e) => new Date(e.date).toLocaleDateString(),
    },
    {
      key: 'billable',
      label: 'Billable',
      render: (e) => e.billable
        ? <span className="badge badge-success">Yes</span>
        : <span className="badge">No</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-16',
      render: (e) => (
        <button
          className="btn btn-ghost btn-icon text-destructive"
          onClick={(ev) => { ev.stopPropagation(); setConfirmDelete(e._id); }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  const visibleEntries = search
    ? entries.filter((e) => {
        const q = search.toLowerCase();
        const user = typeof e.userId === 'string' ? e.userId : e.userId?.name ?? '';
        const task = typeof e.taskId === 'string' ? e.taskId : e.taskId?.title ?? '';
        const project = typeof e.projectId === 'string' ? e.projectId : e.projectId?.title ?? '';
        return user.toLowerCase().includes(q) || task.toLowerCase().includes(q) || project.toLowerCase().includes(q);
      })
    : entries;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Entries</h1>
          <p className="mt-1 text-sm text-neutral-500">Track time spent on tasks</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => { setForm(emptyForm); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> Log Time
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-dashboard">
          <p className="text-sm text-foreground/60">Total Hours</p>
          <p className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="card-dashboard">
          <p className="text-sm text-foreground/60">Entries</p>
          <p className="text-2xl font-bold text-foreground">{total}</p>
        </div>
        <div className="card-dashboard">
          <p className="text-sm text-foreground/60">This Period</p>
          <p className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)}h</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            className="input pl-9"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
          />
        </div>
      </div>

      <DataTable<TimeEntry>
        columns={columns}
        data={visibleEntries}
        total={search ? visibleEntries.length : total}
        page={search ? 1 : page}
        totalPages={search ? 1 : totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No time entries found"
        keyExtractor={(e) => e._id}
        searchPlaceholder=""
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Log Time Entry</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Task ID *</label>
                <input className="input" value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value })} />
              </div>
              <div>
                <label className="form-label">User ID *</label>
                <input className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Project ID</label>
                <input className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Hours *</label>
                  <input className="input" type="number" min="0.25" max="24" step="0.5" value={form.hours || ''} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="form-label">Date *</label>
                  <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="checkbox" id="billable" checked={form.billable} onChange={(e) => setForm({ ...form, billable: e.target.checked })} />
                <label htmlFor="billable" className="form-label mb-0">Billable</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={saving || !form.hours || !form.date || !form.taskId} onClick={handleCreate}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Log Time
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground mb-2">Delete Entry</h2>
            <p className="text-sm text-neutral-500">Are you sure? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-destructive btn-md" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
