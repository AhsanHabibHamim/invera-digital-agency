'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/ui/DataTable';
import * as projectsService from '@/services/projects';
import { useClients, useServiceOptions } from '@/hooks/useEntityOptions';
import { getErrorMessage, isValidObjectId } from '@/lib/utils';
import type { Project } from '@/types';
import { Plus, Search, X, Loader2, AlertCircle } from 'lucide-react';

const statusBadge: Record<string, string> = {
  requested: 'badge-info',
  quoted: 'badge-primary',
  in_progress: 'badge-accent',
  in_review: 'badge-warning',
  completed: 'badge-success',
  closed: 'badge',
};

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ title: '', clientId: '', serviceId: '', status: 'requested' as const });
  const { clients } = useClients();
  const { services } = useServiceOptions();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (statusFilter) params.status = statusFilter;
      const res = await projectsService.getProjects(params);
      if (res.success) {
        const inner = res.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        const d = inner.data ?? inner;
        const items = d.projects ?? d.data ?? d.items ?? [];
        setProjects(items as Project[]);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      } else {
        setFormError(getErrorMessage(res, 'Failed to load projects'));
      }
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to load projects'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleCreate = async () => {
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Project title is required.');
      return;
    }
    if (!isValidObjectId(form.clientId)) {
      setFormError('Please select a valid client.');
      return;
    }
    if (form.serviceId && !isValidObjectId(form.serviceId)) {
      setFormError('Please select a valid service.');
      return;
    }
    setCreating(true);
    try {
      const res = await projectsService.createProject({
        title: form.title,
        clientId: form.clientId,
        serviceId: form.serviceId || undefined,
        status: form.status,
      });
      if (!res.success) {
        setFormError(getErrorMessage(res, 'Failed to create project'));
        return;
      }
      setShowCreate(false);
      setForm({ title: '', clientId: '', serviceId: '', status: 'requested' });
      fetchProjects();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to create project'));
    } finally {
      setCreating(false);
    }
  };

  const statusOptions = ['requested', 'quoted', 'in_progress', 'in_review', 'completed', 'closed'];

  const columns: Column<Project>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (p) => <span className="font-medium text-foreground">{p.title}</span>,
    },
    { key: 'clientId', label: 'Client', render: (p) => p.clientId ? <span className="text-sm">{typeof p.clientId === 'string' ? p.clientId : p.clientId.name}</span> : <span className="text-foreground/40">—</span> },
    {
      key: 'status',
      label: 'Status',
      render: (p) => (
        <span className={`badge ${statusBadge[p.status] || 'badge'}`}>
          {p.status.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'progressPercent',
      label: 'Progress',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-2">
          <div className="progress-bar flex-1 max-w-[100px]">
            <div className="progress-bar-fill" style={{ width: `${p.progressPercent}%` }} />
          </div>
          <span className="text-xs text-foreground/60">{p.progressPercent}%</span>
        </div>
      ),
    },
    {
      key: 'team',
      label: 'Team Members',
      render: (p) => (
        <span>{(p.assignedTeam?.length ?? 0) > 0 ? `${p.assignedTeam!.length} members` : <span className="text-foreground/40">—</span>}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (p) => new Date(p.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (p) => (
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/${p._id}`); }}
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
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage client projects</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            className="input pl-9"
            placeholder="Search projects..."
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
          {statusOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <DataTable<Project>
        columns={columns}
        data={search ? projects.filter((p) => (p.title ?? '').toLowerCase().includes(search.toLowerCase())) : projects}
        total={search ? projects.filter((p) => (p.title ?? '').toLowerCase().includes(search.toLowerCase())).length : total}
        page={search ? 1 : page}
        totalPages={search ? 1 : totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No projects found"
        keyExtractor={(p) => p._id}
        searchPlaceholder=""
      />

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Create Project</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {formError && (
                <div className="form-alert form-alert-error" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="form-label">Project Title *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Client *</label>
                <select
                  className="input"
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Service</label>
                <select
                  className="input"
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                >
                  <option value="">Select a service (optional)...</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                  {statusOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={creating} onClick={handleCreate}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
