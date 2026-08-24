'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/Skeleton';
import { getPermissions, getPermissionGroups, getPermissionModules, createPermission, updatePermission, deletePermission } from '@/services/permissions';
import { getErrorMessage } from '@/lib/utils';
import type { Permission } from '@/types';
import {
  Plus, Pencil, Trash2, X, Check, AlertTriangle, Loader2, Search,
  Key, SearchX,
} from 'lucide-react';

type FormData = {
  name: string;
  slug: string;
  group: string;
  module: string;
  description: string;
};

const emptyForm: FormData = { name: '', slug: '', group: '', module: '', description: '' };

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPerm, setEditPerm] = useState<Permission | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (groupFilter) params.group = groupFilter;
      if (moduleFilter) params.module = moduleFilter;
      const [permsRes, groupsRes, modulesRes] = await Promise.all([
        getPermissions(params),
        getPermissionGroups(),
        getPermissionModules(),
      ]);
      if (permsRes.success) setPermissions(permsRes.data as unknown as Permission[]);
      if (groupsRes.success) setGroups(groupsRes.data as unknown as string[]);
      if (modulesRes.success) setModules(modulesRes.data as unknown as string[]);
    } catch {
      showToast('error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [search, groupFilter, moduleFilter]);

  useEffect(() => { fetchData(); }, [fetchData]); // eslint-disable-line react-hooks/set-state-in-effect

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const openCreate = () => {
    setEditPerm(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Permission) => {
    setEditPerm(p);
    setForm({ name: p.name, slug: p.slug, group: p.group, module: p.module, description: p.description ?? '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.group || !form.module) return;
    setSubmitting(true);
    try {
      if (editPerm) {
        const res = await updatePermission(editPerm._id, form);
        if (res.success) showToast('success', 'Permission updated');
        else showToast('error', getErrorMessage(res, 'Failed to update permission'));
      } else {
        const res = await createPermission(form);
        if (res.success) showToast('success', 'Permission created');
        else showToast('error', getErrorMessage(res, 'Failed to create permission'));
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Something went wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deletePermission(id);
      if (res.success) {
        showToast('success', 'Permission deleted');
        setDeleteConfirm(null);
        fetchData();
      } else {
        showToast('error', getErrorMessage(res, 'Failed to delete permission'));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Failed to delete permission'));
    }
  };

  const filteredByGroup = groupFilter
    ? permissions.filter((p) => p.group === groupFilter)
    : permissions;

  const grouped = filteredByGroup.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const columns: Column<Permission>[] = [
    { key: 'name', label: 'Name', render: (p) => <span className="font-medium text-foreground">{p.name}</span> },
    { key: 'slug', label: 'Slug', render: (p) => <code className="text-xs text-neutral-500">{p.slug}</code> },
    {
      key: 'group',
      label: 'Group',
      render: (p) => <Badge variant="info">{p.group}</Badge>,
    },
    {
      key: 'module',
      label: 'Module',
      render: (p) => <Badge variant="primary">{p.module}</Badge>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (p) => <span className="text-sm text-neutral-500">{p.description ?? '—'}</span>,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-1">
          <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {deleteConfirm === p._id ? (
            <div className="flex gap-1">
              <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }}>
                <Check className="w-3.5 h-3.5" />
              </button>
              <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button className="btn btn-sm btn-ghost text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p._id); }}>
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
          <h1 className="text-2xl font-bold text-foreground">Permissions</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage access permissions</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Permission
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input className="input pl-9" placeholder="Search permissions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[180px]" value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setModuleFilter(''); }}>
          <option value="">All groups</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className="input max-w-[180px]" value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setGroupFilter(''); }}>
          <option value="">All modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        {(groupFilter || moduleFilter || search) && (
          <button className="btn btn-sm btn-ghost" onClick={() => { setGroupFilter(''); setModuleFilter(''); setSearch(''); }}>
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : permissions.length === 0 ? (
        <div className="card-dashboard">
          <div className="empty-state">
            <Key className="empty-state-icon" />
            <p className="empty-state-title">No permissions found</p>
            <p className="empty-state-desc">Create your first permission to start managing access.</p>
            <button className="btn btn-primary btn-md" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add Permission
            </button>
          </div>
        </div>
      ) : groupFilter || moduleFilter ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module} className="card-dashboard">
              <h3 className="dashboard-section-title">{module}</h3>
              <DataTable<Permission>
                columns={columns}
                data={perms}
                total={perms.length}
                page={1}
                totalPages={1}
                onPageChange={() => {}}
                keyExtractor={(p) => p._id}
              />
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="card-dashboard">
              <div className="empty-state">
                <SearchX className="empty-state-icon" />
                <p className="empty-state-title">No matching permissions</p>
                <p className="empty-state-desc">Try different filter criteria.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <DataTable<Permission>
          columns={columns}
          data={permissions}
          total={permissions.length}
          page={1}
          totalPages={1}
          onPageChange={() => {}}
          keyExtractor={(p) => p._id}
        />
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editPerm ? 'Edit Permission' : 'Create Permission'}</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Name</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editPerm ? form.slug : generateSlug(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Slug</label>
                <input className="input" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Group</label>
                  <input className="input" required list="group-options" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} />
                  <datalist id="group-options">
                    {groups.map((g) => <option key={g} value={g} />)}
                  </datalist>
                </div>
                <div>
                  <label className="form-label">Module</label>
                  <input className="input" required list="module-options" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} />
                  <datalist id="module-options">
                    {modules.map((m) => <option key={m} value={m} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-outline btn-md" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-md" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editPerm ? 'Update' : 'Create'}
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
