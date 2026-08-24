'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import { DetailSkeleton } from '@/components/Skeleton';
import { getUser, getUserRoles, assignUserRole, removeUserRole, deactivateUser } from '@/services/users';
import { getRoles } from '@/services/roles';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/utils';
import type { User, Role } from '@/types';

interface UserRoleAssignment {
  _id: string;
  userId: string;
  roleId: string | Role;
  createdAt: string;
}
import {
  ArrowLeft, Mail, Phone, Building, Shield, Calendar, Check, X,
  AlertTriangle, Plus, User as UserIcon,
} from 'lucide-react';

const roleVariant = (role: string) => {
  switch (role) {
    case 'super_admin': return 'destructive';
    case 'admin': return 'warning';
    case 'team': return 'info';
    case 'client': return 'success';
    default: return 'primary';
  }
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [assignedRoles, setAssignedRoles] = useState<UserRoleAssignment[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const isSuperAdminAccount = user?.role === 'super_admin';
  const canManage = currentUser?.role === 'super_admin' || !isSuperAdminAccount;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, rolesRes] = await Promise.all([getUser(id), getRoles()]);
      if (userRes.success) setUser(userRes.data as unknown as User);
      if (rolesRes.success) setAllRoles(rolesRes.data as unknown as Role[]);
      const userRolesRes = await getUserRoles(id);
      if (userRolesRes.success) setAssignedRoles(userRolesRes.data as unknown as UserRoleAssignment[]);
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Failed to load user'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleAssignRole = async (roleId: string) => {
    try {
      const res = await assignUserRole(id, { roleId });
      if (res.success) {
        showToast('success', 'Role assigned');
        fetchData();
      } else {
        showToast('error', getErrorMessage(res, 'Failed to assign role'));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Failed to assign role'));
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      const res = await removeUserRole(id, roleId);
      if (res.success) {
        showToast('success', 'Role removed');
        fetchData();
      } else {
        showToast('error', getErrorMessage(res, 'Failed to remove role'));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Failed to remove role'));
    }
  };

  const handleToggleActive = async () => {
    try {
      const res = await deactivateUser(id);
      if (res.success) {
        showToast('success', `User ${user?.isActive ? 'deactivated' : 'activated'}`);
        setConfirmDeactivate(false);
        fetchData();
      } else {
        showToast('error', getErrorMessage(res, 'Failed to toggle status'));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err, 'Failed to toggle status'));
    }
  };

  if (loading) return <DetailSkeleton />;

  if (!user) {
    return (
      <div className="card-dashboard">
        <div className="empty-state">
          <UserIcon className="empty-state-icon" />
          <p className="empty-state-title">User not found</p>
          <button className="btn btn-outline btn-md" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  const assignedRoleIds = assignedRoles.map((ur) => (typeof ur.roleId === 'string' ? ur.roleId : ur.roleId._id));
  const availableRoles = allRoles.filter((r) => !assignedRoleIds.includes(r._id));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => router.push('/dashboard/users')}>Users</button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{user.name}</span>
      </div>

      <div className="card-dashboard">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="avatar avatar-lg">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              <p className="text-sm text-neutral-500">{user.designation ?? user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!canManage ? (
              <span className="text-xs text-neutral-500">Super Admin account</span>
            ) : confirmDeactivate ? (
              <div className="flex gap-2">
                <button className="btn btn-sm btn-primary" onClick={handleToggleActive}>
                  <Check className="w-3.5 h-3.5" /> Confirm
                </button>
                <button className="btn btn-sm btn-outline" onClick={() => setConfirmDeactivate(false)}>
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            ) : (
              <button className={`btn btn-sm ${user.isActive ? 'btn-outline' : 'btn-primary'}`} onClick={() => setConfirmDeactivate(true)}>
                {user.isActive ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Email</p>
                <p className="text-sm text-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Phone</p>
                <p className="text-sm text-foreground">{user.phone ?? 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Company</p>
                <p className="text-sm text-foreground">{user.company ?? 'Not provided'}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Role</p>
                <Badge variant={roleVariant(user.role)}>{user.role.replace('_', ' ')}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Member Since</p>
                <p className="text-sm text-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.isActive ? 'text-success' : 'text-destructive'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-success' : 'bg-destructive'}`} />
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {user.bio && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-neutral-500 mb-1">Bio</p>
            <p className="text-sm text-foreground">{user.bio}</p>
          </div>
        )}
      </div>

      <div className="card-dashboard">
        <h3 className="dashboard-section-title">Role Assignments</h3>
        {assignedRoles.length === 0 ? (
          <p className="text-sm text-neutral-500">No roles assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {assignedRoles.map((ur) => {
              const role = typeof ur.roleId === 'string' ? null : (ur.roleId as Role);
              return (
                <div key={ur._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{role?.name ?? 'Unknown'}</span>
                    {role?.isSystem && <Badge variant="primary">System</Badge>}
                  </div>
                  <button className="btn btn-sm btn-ghost text-destructive" onClick={() => handleRemoveRole(ur.roleId as string)}>
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {canManage && availableRoles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-neutral-500 mb-2">Assign additional role</p>
            <div className="flex items-center gap-2">
              <select className="input max-w-xs" id="assign-role-select">
                <option value="">Select a role...</option>
                {availableRoles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  const sel = document.getElementById('assign-role-select') as HTMLSelectElement;
                  if (sel.value) handleAssignRole(sel.value);
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Assign
              </button>
            </div>
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
