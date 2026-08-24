'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import * as tasksService from '@/services/tasks';
import * as projectsService from '@/services/projects';
import type { Project, Sprint } from '@/types';
import { Plus, Search, X, Loader2, Trash2, FolderKanban } from 'lucide-react';

const STATUS_OPTIONS = ['planning', 'active', 'completed', 'cancelled'] as const;

const statusBadge: Record<string, string> = {
  planning: 'warning',
  active: 'success',
  completed: 'info',
  cancelled: 'destructive',
};

interface SprintForm {
  title: string;
  projectId: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: Sprint['status'];
}

const emptyForm: SprintForm = {
  title: '',
  projectId: '',
  goal: '',
  startDate: '',
  endDate: '',
  status: 'planning',
};

export default function SprintsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [form, setForm] = useState<SprintForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectsService.getProjects({ limit: '100' });
      if (res.success) setProjects(res.data.projects ?? []);
    } catch {
      // handled
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]); // eslint-disable-line react-hooks/set-state-in-effect

  const fetchSprints = useCallback(async () => {
    if (!selectedProjectId) {
      setSprints([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await tasksService.getProjectSprints(selectedProjectId);
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        const filtered = list.filter((s) => {
          if (statusFilter && s.status !== statusFilter) return false;
          if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
          return true;
        });
        setSprints(filtered);
        setTotal(filtered.length);
        setTotalPages(1);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, search, statusFilter]);

  useEffect(() => { fetchSprints(); }, [fetchSprints]); // eslint-disable-line react-hooks/set-state-in-effect

  const openCreate = () => {
    setEditingSprint(null);
    setForm({ ...emptyForm, projectId: selectedProjectId });
    setShowModal(true);
  };

  const openEdit = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setForm({
      title: sprint.title,
      projectId: sprint.projectId,
      goal: sprint.goal || '',
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingSprint) {
        await tasksService.updateSprint(editingSprint._id, form);
      } else {
        await tasksService.createSprint(form);
      }
      setShowModal(false);
      fetchSprints();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tasksService.deleteSprint(id);
      setConfirmDelete(null);
      fetchSprints();
    } catch {
      // handled
    }
  };

  const columns: Column<Sprint>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (s) => <span className="font-medium text-foreground">{s.title}</span>,
    },
    {
      key: 'projectId',
      label: 'Project',
      render: (s) => s.projectId || <span className="text-foreground/40">—</span>,
    },
    {
      key: 'goal',
      label: 'Goal',
      render: (s) => s.goal ? <span className="text-sm text-foreground/70 line-clamp-1">{s.goal}</span> : <span className="text-foreground/40">—</span>,
    },
    {
      key: 'startDate',
      label: 'Start',
      sortable: true,
      render: (s) => new Date(s.startDate).toLocaleDateString(),
    },
    {
      key: 'endDate',
      label: 'End',
      sortable: true,
      render: (s) => new Date(s.endDate).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (s) => <Badge variant={statusBadge[s.status] as any}>{s.status}</Badge>, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-24',
      render: (s) => (
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
            Edit
          </button>
          <button
            className="btn btn-ghost btn-icon text-destructive"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(s._id); }}
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
          <h1 className="text-2xl font-bold text-foreground">Sprints</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage project sprints</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus className="w-4 h-4" /> New Sprint
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input w-auto min-w-[220px]"
          value={selectedProjectId}
          onChange={(e) => { setSelectedProjectId(e.target.value); setPage(1); }}
        >
          <option value="">Select a project...</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            className="input pl-9"
            placeholder="Search sprints..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {!selectedProjectId && (
        <div className="empty-state">
          <FolderKanban className="empty-state-icon" />
          <p className="empty-state-title">Select a project</p>
          <p className="empty-state-desc">Choose a project above to view its sprints.</p>
        </div>
      )}

      <DataTable<Sprint>
        columns={columns}
        data={sprints}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No sprints found"
        keyExtractor={(s) => s._id}
        searchPlaceholder=""
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editingSprint ? 'Edit Sprint' : 'Create Sprint'}</h2>
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
                <label className="form-label">Project</label>
                <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  <option value="">Select project...</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Goal</label>
                <textarea className="input" rows={3} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Start Date *</label>
                  <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">End Date *</label>
                  <input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Sprint['status'] })}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={saving || !form.title.trim() || !form.projectId || !form.startDate || !form.endDate} onClick={handleSave}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingSprint ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground mb-2">Delete Sprint</h2>
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
