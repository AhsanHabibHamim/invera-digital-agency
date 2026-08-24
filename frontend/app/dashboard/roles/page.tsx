'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/Skeleton';
import { getRoles, createRole, updateRole, deleteRole, cloneRole } from '@/services/roles';
import { getErrorMessage } from '@/lib/utils';
import type { Role } from '@/types';
import {
  Plus, Pencil, Trash2, Copy, X, Check, AlertTriangle, Loader2, Search,
  Shield, SearchX,
} from 'lucide-react';

type FormData = {
  name: string;
  slug: string;
  description: string;
};

const emptyForm: FormData = { name: '', slug: '', description: '' };

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [cloneSource, setCloneSource] = useState<Role | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const res = await getRoles(params);
      if (res.success) setRoles(res.data as unknown as Role[]);
    } catch {
      showToast('error', 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]); // eslint-disable-line react-hooks/set-state-in-effect

  const openCreate = () => {
    setEditRole(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (r: Role) => {
    setEditRole(r);
    setForm({ name: r.name, slug: r.slug, description: r.description ?? '' });
    setModalOpen(true);
  };

  const openClone = (r: Role) => {
    setCloneSource(r);
    setForm({ name: `${r.name} (Copy)`, slug: '', description: r.description ?? '' });
    setCloneOpen(true);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      const payload = { name: form.name, description: form.description || undefined };
      if (editRole) {
        const res = await updateRole(editRole._id, { ...payload, slug: form.slug || generateSlug(form.name) });
        if (res.success) showToast('success', 'Role updated');
        else showToast('error', getErrorMessage(res, 'Failed to update role'));
      } else {
        const res = await createRole({ ...payload, slug: form.slug || generateSlug(form.name) });
        if (res.success) showToast('success', 'Role created');
        else showToast('error', getErrorMessage(res, 'Failed to create role'));
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Something went wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !cloneSource) return;
    setSubmitting(true);
    try {
      const res = await cloneRole(cloneSource._id, { name: form.name, slug: form.slug || generateSlug(form.name) });
      if (res.success) {
        showToast('success', 'Role cloned');
        setCloneOpen(false);
        fetchRoles();
      } else {
        showToast('error', getErrorMessage(res, 'Failed to clone role'));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Failed to clone role'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteRole(id);
      if (res.success) {
        showToast('success', 'Role deleted');
        setDeleteConfirm(null);
        fetchRoles();
      } else {
        showToast('error', getErrorMessage(res, 'Failed to delete role'));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Failed to delete role'));
    }
  };

  const columns: Column<Role>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (r) => (
        <button className="text-left font-medium text-foreground hover:text-primary transition-colors" onClick={() => router.push(`/dashboard/roles/${r._id}`)}>
          {r.name}
        </button>
      ),
    },
    { key: 'slug', label: 'Slug', render: (r) => <code className="text-xs text-neutral-500">{r.slug}</code> },
    {
      key: 'description',
      label: 'Description',
      render: (r) => <span className="text-sm text-neutral-500">{r.description ?? '—'}</span>,
    },
    {
      key: 'isSystem',
      label: 'System',
      render: (r) => r.isSystem ? <Badge variant="primary">System</Badge> : <span className="text-xs text-neutral-500">Custom</span>,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openEdit(r); }} disabled={r.isSystem}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openClone(r); }}>
            <Copy className="w-3.5 h-3.5" />
          </button>
          {deleteConfirm === r._id ? (
            <div className="flex gap-1">
              <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}>
                <Check className="w-3.5 h-3.5" />
              </button>
              <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button className="btn btn-sm btn-ghost text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(r._id); }} disabled={r.isSystem}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles</h1>
          <p className="mt-1 text-sm text-neutral-500">Define access roles and permissions</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Create Role
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input className="input pl-9" placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : roles.length === 0 ? (
        <div className="card-dashboard">
          <div className="empty-state">
            <Shield className="empty-state-icon" />
            <p className="empty-state-title">No roles found</p>
            <p className="empty-state-desc">Create your first role to manage permissions.</p>
            <button className="btn btn-primary btn-md" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Create Role
            </button>
          </div>
        </div>
      ) : (
        <DataTable<Role>
          columns={columns}
          data={roles}
          total={roles.length}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
          keyExtractor={(r) => r._id}
        />
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editRole ? 'Edit Role' : 'Create Role'}</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Name</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || generateSlug(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Slug</label>
                <input className="input" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-outline btn-md" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-md" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cloneOpen && cloneSource && (
        <div className="modal-overlay" onClick={() => setCloneOpen(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Clone Role from &quot;{cloneSource.name}&quot;</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setCloneOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleClone} className="space-y-4">
              <div>
                <label className="form-label">Name</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-outline btn-md" onClick={() => setCloneOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-md" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Clone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'border-destructive/30' : 'border-success/30'}`}>
          {toast.type === 'success' ? <Check className="w-4 h-4 text-success" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
