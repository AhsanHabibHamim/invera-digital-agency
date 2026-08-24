'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import * as tasksService from '@/services/tasks';
import type { Task } from '@/types';
import { Plus, Search, X, Loader2, ChevronDown, Trash2 } from 'lucide-react';

const STATUS_OPTIONS = ['todo', 'in_progress', 'in_review', 'done', 'cancelled'] as const;
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;
const TYPE_OPTIONS = ['task', 'bug', 'issue', 'feature'] as const;

const priorityBadge: Record<string, string> = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'info',
  low: 'primary',
};

const typeBadge: Record<string, string> = {
  task: 'primary',
  bug: 'destructive',
  issue: 'warning',
  feature: 'accent',
};

const statusBadge: Record<string, string> = {
  todo: 'badge',
  in_progress: 'badge-info',
  in_review: 'badge-warning',
  done: 'badge-success',
  cancelled: 'badge-destructive',
};

interface TaskForm {
  title: string;
  description: string;
  type: Task['type'];
  priority: Task['priority'];
  assignedTo: string;
  dueDate: string;
  estimatedHours: number;
  projectId: string;
}

const emptyForm: TaskForm = {
  title: '',
  description: '',
  type: 'task',
  priority: 'medium',
  assignedTo: '',
  dueDate: '',
  estimatedHours: 0,
  projectId: '',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await tasksService.getTasks(params);
      if (res.success) {
        const inner = res.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        const d = inner.data ?? inner;
        const items = d.tasks ?? d.data ?? d.items ?? [];
        setTasks(items as Task[]);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter, typeFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]); // eslint-disable-line react-hooks/set-state-in-effect

  const openCreate = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      type: task.type,
      priority: task.priority,
      assignedTo: typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedTo?._id ?? '',
      dueDate: task.dueDate || '',
      estimatedHours: task.estimatedHours || 0,
      projectId: typeof task.projectId === 'string' ? task.projectId : task.projectId?._id ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingTask) {
        await tasksService.updateTask(editingTask._id, form);
      } else {
        await tasksService.createTask(form);
      }
      setShowModal(false);
      fetchTasks();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tasksService.deleteTask(id);
      setConfirmDelete(null);
      fetchTasks();
    } catch {
      // handled
    }
  };

  const handleStatusChange = async (id: string, status: Task['status']) => {
    try {
      await tasksService.updateTask(id, { status });
      setStatusDropdown(null);
      fetchTasks();
    } catch {
      // handled
    }
  };

  const columns: Column<Task>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (t) => <span className="font-medium text-foreground">{t.title}</span>,
    },
    {
      key: 'projectId',
      label: 'Project',
      render: (t) => (typeof t.projectId === 'string' ? t.projectId : t.projectId?.title) || <span className="text-foreground/40">—</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (t) => <Badge variant={typeBadge[t.type] as any}>{t.type}</Badge>, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (t) => <Badge variant={priorityBadge[t.priority] as any}>{t.priority}</Badge>, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    {
      key: 'status',
      label: 'Status',
      render: (t) => (
        <div className="relative">
          <button
            className={`badge ${statusBadge[t.status] || 'badge'} cursor-pointer inline-flex items-center gap-1`}
            onClick={(e) => { e.stopPropagation(); setStatusDropdown(statusDropdown === t._id ? null : t._id); }}
          >
            {t.status.replace(/_/g, ' ')} <ChevronDown className="w-3 h-3" />
          </button>
          {statusDropdown === t._id && (
            <div className="dropdown mt-1" style={{ position: 'absolute', zIndex: 50 }}>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  className="dropdown-item"
                  onClick={(e) => { e.stopPropagation(); handleStatusChange(t._id, s); }}
                >
                  <span className={`badge ${statusBadge[s]}`}>{s.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (t) => (typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?.name) || <span className="text-foreground/40">—</span>,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (t) => t.dueDate ? new Date(t.dueDate).toLocaleDateString() : <span className="text-foreground/40">—</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-24',
      render: (t) => (
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(t); }}>
            Edit
          </button>
          <button
            className="btn btn-ghost btn-icon text-destructive"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(t._id); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage project tasks</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            className="input pl-9"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select className="input w-auto" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input w-auto" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Type</option>
          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <DataTable<Task>
        columns={columns}
        data={tasks}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No tasks found"
        keyExtractor={(t) => t._id}
        searchPlaceholder=""
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Title *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Type</label>
                  <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Task['type'] })}>
                    {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Assigned To</label>
                  <input className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Project ID</label>
                  <input className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Estimated Hours</label>
                  <input className="input" type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={saving || !form.title.trim()} onClick={handleSave}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingTask ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground mb-2">Delete Task</h2>
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
