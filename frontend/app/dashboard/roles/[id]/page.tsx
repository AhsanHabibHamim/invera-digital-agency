'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import { DetailSkeleton } from '@/components/Skeleton';
import { getRole, getRolePermissions, assignRolePermission, removeRolePermission } from '@/services/roles';
import { getPermissions } from '@/services/permissions';
import type { Role, Permission, RolePermission } from '@/types';
import {
  ArrowLeft, Check, X, AlertTriangle, Shield, Loader2, Search,
} from 'lucide-react';

interface GroupedPermissions {
  [module: string]: Permission[];
}

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [rolePerms, setRolePerms] = useState<RolePermission[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roleRes, permsRes] = await Promise.all([
        getRole(id),
        getPermissions(),
      ]);
      if (roleRes.success) setRole(roleRes.data as unknown as Role);
      if (permsRes.success) setAllPerms(permsRes.data as unknown as Permission[]);
      const rolePermsRes = await getRolePermissions(id);
      if (rolePermsRes.success) setRolePerms(rolePermsRes.data as unknown as RolePermission[]);
    } catch {
      showToast('error', 'Failed to load role');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]); // eslint-disable-line react-hooks/set-state-in-effect

  const assignedPermIds = new Set(rolePerms.map((rp) => typeof rp.permissionId === 'string' ? rp.permissionId : rp.permissionId._id));

  const handleToggle = async (permId: string, currentlyAssigned: boolean) => {
    try {
      if (currentlyAssigned) {
        const res = await removeRolePermission(id, permId);
        if (res.success) {
          showToast('success', 'Permission removed');
          fetchData();
        }
      } else {
        const res = await assignRolePermission(id, { permissionId: permId });
        if (res.success) {
          showToast('success', 'Permission assigned');
          fetchData();
        }
      }
    } catch {
      showToast('error', 'Failed to update permission');
    }
  };

  const filteredPerms = allPerms.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.slug.toLowerCase().includes(search.toLowerCase())) return false;
    if (moduleFilter && p.module !== moduleFilter) return false;
    return true;
  });

  const grouped: GroupedPermissions = {};
  for (const p of filteredPerms) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  }

  const modules = [...new Set(allPerms.map((p) => p.module))];

  if (loading) return <DetailSkeleton />;

  if (!role) {
    return (
      <div className="card-dashboard">
        <div className="empty-state">
          <Shield className="empty-state-icon" />
          <p className="empty-state-title">Role not found</p>
          <button className="btn btn-outline btn-md" onClick={() => router.push('/dashboard/roles')}>
            <ArrowLeft className="w-4 h-4" /> Back to roles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => router.push('/dashboard/roles')}>Roles</button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{role.name}</span>
      </div>

      <div className="card-dashboard">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{role.name}</h1>
            <p className="text-sm text-neutral-500">{role.description ?? 'No description'}</p>
          </div>
          {role.isSystem && <Badge variant="primary">System Role</Badge>}
        </div>
        <div className="flex items-center gap-4 text-sm text-neutral-500">
          <span>Slug: <code className="text-foreground">{role.slug}</code></span>
          <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="card-dashboard">
        <h3 className="dashboard-section-title">Permission Matrix</h3>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input className="input pl-9" placeholder="Search permissions..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input max-w-[200px]" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="">All modules</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="empty-state">
            <Search className="empty-state-icon" />
            <p className="empty-state-title">No permissions found</p>
            <p className="empty-state-desc">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([module, perms]) => (
              <div key={module}>
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border">
                  {module}
                </h4>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="w-8"></th>
                        <th>Permission</th>
                        <th>Slug</th>
                        <th>Group</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perms.map((p) => {
                        const assigned = assignedPermIds.has(p._id);
                        return (
                          <tr key={p._id} className={assigned ? 'bg-primary/5' : ''}>
                            <td>
                              <button
                                className="checkbox"
                                role="checkbox"
                                aria-checked={assigned}
                                onClick={() => handleToggle(p._id, assigned)}
                              />
                            </td>
                            <td className="font-medium text-foreground">{p.name}</td>
                            <td><code className="text-xs text-neutral-500">{p.slug}</code></td>
                            <td><Badge variant="info">{p.group}</Badge></td>
                            <td className="text-sm text-neutral-500">{p.description ?? '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'border-destructive/30' : 'border-success/30'}`}>
          {toast.type === 'success' ? <Check className="w-4 h-4 text-success" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
