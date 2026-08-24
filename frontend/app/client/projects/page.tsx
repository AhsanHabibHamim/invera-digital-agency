'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { TableSkeleton } from '@/components/Skeleton';
import * as projectsService from '@/services/projects';
import * as servicesService from '@/services/services';
import type { Project, Service } from '@/types';
import { toast } from 'sonner';
import {
  Search, Briefcase, Plus, X, Loader2, Rocket,
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  requested: 'badge-info',
  quoted: 'badge-primary',
  in_progress: 'badge-accent',
  in_review: 'badge-warning',
  completed: 'badge-success',
  closed: 'badge',
};

const EMPTY_FORM = { title: '', description: '', serviceId: '' };

export default function ClientProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // New project request modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [services, setServices] = useState<Service[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const res = await projectsService.getProjects(params);
      if (res.success) {
        setProjects(res.data.projects ?? res.data?.items ?? []);
        setTotal(res.data.total ?? 0);
        setTotalPages(res.data.totalPages ?? 1);
      } else {
        setError(res.message || 'Failed to load projects');
      }
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]); // eslint-disable-line react-hooks/set-state-in-effect

  useEffect(() => {
    servicesService
      .getServices()
      .then((res) => {
        if (res.success) setServices(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => undefined);
  }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, string> = { title: form.title.trim() };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.serviceId) payload.serviceId = form.serviceId;
      const res = await projectsService.createProject(payload);
      if (res.success && res.data) {
        setShowModal(false);
        setForm(EMPTY_FORM);
        setPage(1);
        await fetchProjects();
        router.push(`/client/projects/${(res.data as Project)._id}`);
      } else {
        toast.error(res.message || 'Could not submit your request');
      }
    } catch {
      toast.error('Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (p) => (
        <span className="font-medium text-foreground">{p.title}</span>
      ),
    },
    {
      key: 'serviceId',
      label: 'Service',
      render: (p) =>
        typeof p.serviceId === 'object' && p.serviceId ? (
          <span className="text-foreground/70">{p.serviceId.title}</span>
        ) : (
          <span className="text-foreground/40">—</span>
        ),
    },
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
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (p) => new Date(p.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-20',
      render: (p) => (
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => { e.stopPropagation(); router.push(`/client/projects/${p._id}`); }}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Projects</h1>
          <p className="mt-1 text-sm text-neutral-500">Track your project progress</p>
        </div>
        <button
          className="btn btn-primary btn-md gap-2xs shadow-lg shadow-primary/20"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} />
          Request a Project
        </button>
      </div>

      {/* New project request modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            className="card-dashboard w-full max-w-lg rounded-2xl border border-primary/15 p-md"
            role="dialog"
            aria-modal="true"
            aria-label="Request a project"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-sm flex items-start justify-between gap-xs">
              <div className="flex items-center gap-2xs">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 text-white shadow-md shadow-primary/25">
                  <Rocket size={18} />
                </span>
                <div>
                  <h2 className="text-h5 font-bold text-foreground">Start a new project</h2>
                  <p className="text-caption text-foreground/50">
                    Tell us what you need — we&apos;ll get back within 24 hours.
                  </p>
                </div>
              </div>
              <button
                className="icon-btn shrink-0"
                onClick={() => !submitting && setShowModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="flex flex-col gap-sm">
              <div>
                <label htmlFor="project-title" className="form-label">
                  Project title *
                </label>
                <input
                  id="project-title"
                  className="input"
                  placeholder="e.g. SaaS dashboard for my startup"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={200}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="project-service" className="form-label">
                  Service
                </label>
                <select
                  id="project-service"
                  className="input"
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                >
                  <option value="">Not sure yet — advise me</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="project-desc" className="form-label">
                  Describe your project
                </label>
                <textarea
                  id="project-desc"
                  className="input min-h-[110px] resize-y"
                  placeholder="Goals, features you need, timeline, budget range… anything helps."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={4000}
                />
              </div>

              <div className="mt-3xs flex items-center justify-end gap-2xs">
                <button
                  type="button"
                  className="btn btn-outline btn-md"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md gap-2xs"
                  disabled={submitting || form.title.trim().length < 2}
                >
                  {submitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Rocket size={15} />
                  )}
                  Submit request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input
          className="input pl-9"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : projects.length === 0 && !error ? (
        <div className="card-dashboard">
          <div className="empty-state">
            <Briefcase className="empty-state-icon" />
            <p className="empty-state-title">No projects found</p>
            <p className="empty-state-desc">
              You don&apos;t have any projects yet — start your first one!
            </p>
            <button className="btn btn-primary btn-md mt-sm gap-2xs" onClick={() => setShowModal(true)}>
              <Plus size={16} />
              Request a Project
            </button>
          </div>
        </div>
      ) : (
        <DataTable<Project>
          columns={columns}
          data={projects}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={(q) => { setSearch(q); setPage(1); }}
          isLoading={false}
          searchPlaceholder=""
          emptyMessage="No projects found"
          keyExtractor={(p) => p._id}
        />
      )}
    </div>
  );
}
