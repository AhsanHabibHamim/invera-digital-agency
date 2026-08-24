'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/Skeleton';
import { getUsers, createUser, updateUser, deactivateUser } from '@/services/users';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/utils';
import type { User, UserRole, PaginatedResponse } from '@/types';
import {
  Plus, Pencil, Trash2, Search, X, Check, AlertTriangle, Loader2,
  User as UserIcon,
} from 'lucide-react';

const ALL_ROLE_OPTIONS: UserRole[] = ['super_admin', 'admin', 'team', 'client'];

type FormData = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  company: string;
};

const emptyForm: FormData = {
  name: '', email: '', password: '', role: 'team', phone: '', company: '',
};

const roleVariant = (role: string) => {
  switch (role) {
    case 'super_admin': return 'destructive';
    case 'admin': return 'warning';
    case 'team': return 'info';
    case 'client': return 'success';
    default: return 'primary';
  }
};

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const creatableRoles: UserRole[] =
    currentUser?.role === 'super_admin'
      ? ['super_admin', 'admin', 'team']
      : ['admin', 'team'];

  const canManageUser = (target: User): boolean => {
    if (target.role === 'super_admin') return currentUser?.role === 'super_admin';
    return true;
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (roleFilter) params.role = roleFilter;
      const res = await getUsers(params);
      if (res.success) {
        const d = res.data as unknown as PaginatedResponse<User>;
        const items = d.users ?? d.data ?? d.items ?? [];
        setUsers(items ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      } else {
        showToast('error', getErrorMessage(res, 'Failed to load users'));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleSearch = (q: string) => { setSearch(q); setPage(1); };

  const openCreate = () => {
    setEditUser(null);
    setForm({ ...emptyForm, role: creatableRoles[0] ?? 'team' });
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    if (!canManageUser(u)) {
      showToast('error', 'You are not allowed to manage a Super Admin account.');
      return;
    }
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone ?? '', company: u.company ?? '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editUser) {
        const payload: Record<string, string> = { name: form.name, email: form.email, role: form.role, phone: form.phone, company: form.company };
        if (form.password) payload.password = form.password;
        const res = await updateUser(editUser._id, payload);
        if (res.success) {
          showToast('success', 'User updated');
        } else {
          showToast('error', getErrorMessage(res, 'Failed to update user'));
          return;
        }
      } else {
        const res = await createUser({ ...form, password: form.password });
        if (res.success) {
          showToast('success', 'User created');
        } else {
          showToast('error', getErrorMessage(res, 'Failed to create user'));
          return;
        }
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await deactivateUser(id);
      if (res.success) {
        showToast('success', 'User deactivated');
        fetchUsers();
      } else {
        showToast('error', getErrorMessage(res, 'Failed to toggle status'));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Failed to toggle status'));
    }
    setConfirmId(null);
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (u) => (
        <button className="flex items-center gap-2 text-left" onClick={() => router.push(`/dashboard/users/${u._id}`)}>
          <div className="avatar avatar-sm">{u.name.charAt(0).toUpperCase()}</div>
          <div>
            <p className="font-medium text-foreground">{u.name}</p>
            {u.company && <p className="text-xs text-neutral-500">{u.company}</p>}
          </div>
        </button>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (u) => <Badge variant={roleVariant(u.role)}>{u.role.replace('_', ' ')}</Badge>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (u) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.isActive ? 'text-success' : 'text-destructive'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-success' : 'bg-destructive'}`} />
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (u) => <span className="text-neutral-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-1">
          {canManageUser(u) && (
            <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openEdit(u); }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {confirmId === u._id ? (
            <div className="flex gap-1">
              <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); handleToggleActive(u._id); }}>
                <Check className="w-3.5 h-3.5" />
              </button>
              <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setConfirmId(null); }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : u.isActive && canManageUser(u) ? (
            <button
              className="btn btn-sm btn-outline"
              onClick={(e) => { e.stopPropagation(); setConfirmId(u._id); }}
            >
              Deactivate
            </button>
          ) : (
            <span className="text-xs text-neutral-500">{u.isActive ? '' : 'Inactive'}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage team members and clients</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input className="input pl-9" placeholder="Search users..." value={search} onChange={(e) => handleSearch(e.target.value)} />
        </div>
        {ALL_ROLE_OPTIONS.map((r) => (
          <button
            key={r}
            className={`filter-pill ${roleFilter === r ? 'active' : ''}`}
            onClick={() => { setRoleFilter(roleFilter === r ? '' : r); setPage(1); }}
          >
            {r.replace('_', ' ')}
          </button>
        ))}
        {roleFilter && (
          <button className="btn btn-sm btn-ghost" onClick={() => { setRoleFilter(''); setPage(1); }}>
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : users.length === 0 ? (
        <div className="card-dashboard">
          <div className="empty-state">
            <UserIcon className="empty-state-icon" />
            <p className="empty-state-title">No users found</p>
            <p className="empty-state-desc">Get started by creating your first user.</p>
            <button className="btn btn-primary btn-md" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>
      ) : (
        <DataTable<User>
          columns={columns}
          data={search ? users.filter((u) => (u.name ?? '').toLowerCase().includes(search.toLowerCase()) || (u.email ?? '').toLowerCase().includes(search.toLowerCase())) : users}
          total={search ? users.filter((u) => (u.name ?? '').toLowerCase().includes(search.toLowerCase()) || (u.email ?? '').toLowerCase().includes(search.toLowerCase())).length : total}
          page={search ? 1 : page}
          totalPages={search ? 1 : totalPages}
          onPageChange={setPage}
          keyExtractor={(u) => u._id}
        />
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editUser ? 'Edit User' : 'Create User'}</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => setModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Name</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="form-label">{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input className="input" type="password" required={!editUser} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                  {editUser && !creatableRoles.includes(editUser.role) && (
                    <option value={editUser.role} disabled>{editUser.role.replace('_', ' ')} (read-only)</option>
                  )}
                  {creatableRoles.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
                <p className="text-xs text-foreground/40 mt-1">
                  Client accounts are created through the public proposal flow.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Phone</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Company</label>
                  <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-outline btn-md" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-md" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editUser ? 'Update' : 'Create'}
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
