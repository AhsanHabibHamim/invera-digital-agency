'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import DashboardStats from '@/components/dashboard/DashboardStats';
import Badge from '@/components/ui/Badge';
import * as salesService from '@/services/sales';
import * as usersService from '@/services/users';
import type { SalesPipeline, SalesTarget, Commission, SalesStats, User } from '@/types';
import { api } from '@/lib/api';
import {
  DollarSign, TrendingUp, Target, PieChart, Plus, X, Loader2, CheckCircle2, CircleDollarSign, Check, Trash2,
} from 'lucide-react';

type Tab = 'pipelines' | 'targets' | 'commissions';

const emptyTargetForm = {
  userId: '', targetAmount: 0, currency: 'USD',
  period: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly', startDate: '', endDate: '', achievedAmount: 0, notes: '',
};

const emptyCommissionForm = {
  userId: '', dealId: '', dealName: '', dealValue: 0,
  commissionRate: 0, commissionAmount: 0, currency: 'USD', notes: '',
};

export default function SalesPage() {
  const [tab, setTab] = useState<Tab>('pipelines');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sales</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage pipelines, targets, and commissions</p>
      </div>
      <SalesStatsCards />
      <div className="flex gap-1 border-b border-border">
        {(['pipelines', 'targets', 'commissions'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'pipelines' && <PipelinesTab />}
      {tab === 'targets' && <TargetsTab />}
      {tab === 'commissions' && <CommissionsTab />}
    </div>
  );
}

function SalesStatsCards() {
  const [stats, setStats] = useState<SalesStats | null>(null);

  useEffect(() => {
    salesService.getSalesStats().then((res) => {
      if (res.success) setStats(res.data);
    }).catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <DashboardStats
      stats={[
        { label: 'Total Targets', value: stats.totalTargets, icon: <TrendingUp size={18} /> },
        { label: 'Active Targets', value: stats.activeTargets, icon: <CheckCircle2 size={18} /> },
        { label: 'Pending Commissions', value: stats.pendingCommissions, icon: <DollarSign size={18} /> },
        { label: 'Approved Commissions', value: stats.approvedCommissions, icon: <PieChart size={18} /> },
      ]}
    />
  );
}

function PipelinesTab() {
  const [pipelines, setPipelines] = useState<SalesPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<SalesPipeline | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [stages, setStages] = useState<{ name: string; order: number; color?: string }[]>([
    { name: 'Lead', order: 0 },
    { name: 'Contacted', order: 1 },
    { name: 'Qualified', order: 2 },
    { name: 'Proposal', order: 3 },
    { name: 'Negotiation', order: 4 },
    { name: 'Closed Won', order: 5, color: '#22c55e' },
  ]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesService.getPipelines();
      if (res.success) {
        setPipelines(res.data ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]); // eslint-disable-line react-hooks/set-state-in-effect

  const openEdit = (p: SalesPipeline) => {
    setEditing(p);
    setName(p.name);
    setStages(p.stages.map((s) => ({ name: s.name, order: s.order, color: s.color })));
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditing(null);
    setName('');
    setStages([{ name: 'Lead', order: 0 }, { name: 'Contacted', order: 1 }, { name: 'Qualified', order: 2 }, { name: 'Proposal', order: 3 }, { name: 'Negotiation', order: 4 }, { name: 'Closed Won', order: 5, color: '#22c55e' }]);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      if (editing) {
        await salesService.updatePipeline(editing._id, { name, stages } as unknown as Partial<SalesPipeline>);
      } else {
        await salesService.createPipeline({ name, stages });
      }
      closeModal();
      fetch();
    } finally { setCreating(false); }
  };

  const handleSetDefault = async (id: string) => {
    await salesService.updatePipeline(id, { isDefault: true } as unknown as Partial<SalesPipeline>);
    fetch();
  };

  const handleDelete = async (id: string) => {
    await salesService.deletePipeline(id);
    fetch();
  };

  const addStage = () => setStages((prev) => [...prev, { name: '', order: prev.length }]);
  const removeStage = (idx: number) => setStages((prev) => prev.filter((_, i) => i !== idx));
  const updateStage = (idx: number, field: string, value: string | boolean) => setStages((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  if (loading) return <div className="skeleton h-48" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn btn-primary btn-md" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Pipeline
        </button>
      </div>
      {pipelines.length === 0 ? (
        <div className="empty-state">
          <Target className="w-12 h-12 mx-auto mb-3 text-foreground/30" />
          <p>No pipelines created yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pipelines.map((p) => (
            <div key={p._id} className="card-dashboard">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  {p.isDefault && <Badge variant="success">Default</Badge>}
                </div>
                <div className="flex gap-2">
                  {!p.isDefault && (
                    <button className="btn btn-ghost btn-icon" onClick={() => handleSetDefault(p._id)} title="Set as default">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button className="btn btn-ghost btn-icon" onClick={() => openEdit(p)}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  <button className="btn btn-ghost btn-icon text-destructive" onClick={() => handleDelete(p._id)}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.stages.sort((a, b) => a.order - b.order).map((s) => (
                  <span key={s._id ?? s.name} className="px-2 py-1 text-xs rounded-md border border-border" style={s.color ? { borderColor: s.color, color: s.color } : {}}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit Pipeline' : 'Create Pipeline'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Pipeline Name *</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales Pipeline" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Stages</label>
                  <button className="btn btn-outline btn-sm" onClick={addStage}><Plus className="w-3 h-3" /> Add Stage</button>
                </div>
                <div className="space-y-2">
                  {stages.map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input className="input flex-1" placeholder="Stage name" value={s.name} onChange={(e) => updateStage(idx, 'name', e.target.value)} />
                      <input className="input w-20 text-center" type="color" value={s.color || '#6366f1'} onChange={(e) => updateStage(idx, 'color', e.target.value)} />
                      <button className="btn btn-ghost btn-icon text-destructive" onClick={() => removeStage(idx)} disabled={stages.length <= 1}><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={creating || !name.trim()} onClick={handleSave}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TargetsTab() {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SalesTarget | null>(null);
  const [form, setForm] = useState<typeof emptyTargetForm>(emptyTargetForm);
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, uRes] = await Promise.all([
        salesService.getTargets({ page: String(page), limit: '20' }),
        usersService.getUsers({ limit: '100' }),
      ]);
      if (tRes.success) {
        setTargets(tRes.data.records ?? []);
        setTotal(tRes.data.total ?? 0);
        setTotalPages(tRes.data.totalPages ?? 1);
      }
      if (uRes.success) {
        setUsers(uRes.data.users ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]); // eslint-disable-line react-hooks/set-state-in-effect

  const userName = (id: string) => users.find((u) => u._id === id || u.id === id)?.name || id;
  const userIdOf = (id: string | { _id?: string; name: string; email?: string }) =>
    typeof id === 'string' ? id : id?._id ?? '';

  const openEdit = (t: SalesTarget) => {
    setEditing(t);
    setForm({
      userId: userIdOf(t.userId) || '', targetAmount: t.targetAmount, currency: t.currency || 'USD',
      period: t.period || 'monthly', startDate: t.startDate?.split('T')[0] || '', endDate: t.endDate?.split('T')[0] || '',
      achievedAmount: t.achievedAmount ?? 0, notes: t.notes || '',
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyTargetForm);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (editing) {
        await salesService.updateTarget(editing._id, form as unknown as Partial<SalesTarget>);
      } else {
        await salesService.createTarget(form as unknown as Partial<SalesTarget>);
      }
      setShowModal(false);
      fetch();
    } finally { setSubmitting(false); }
  };

  const columns: Column<SalesTarget>[] = [
    { key: 'user', label: 'User', render: (t) => <span className="font-medium text-foreground">{userName(userIdOf(t.userId))}</span> },
    { key: 'period', label: 'Period', sortable: true, render: (t) => <Badge>{t.period}</Badge> },
    { key: 'targetAmount', label: 'Target', sortable: true, render: (t) => <span className="font-mono">{t.currency || 'USD'} {t.targetAmount?.toLocaleString()}</span> },
    { key: 'achievedAmount', label: 'Achieved', render: (t) => <span className="font-mono">{t.currency || 'USD'} {t.achievedAmount?.toLocaleString() ?? 0}</span> },
    {
      key: 'progress', label: 'Progress', render: (t) => {
        const pct = t.targetAmount > 0 ? Math.min(100, (t.achievedAmount / t.targetAmount) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="progress-bar flex-1 max-w-[120px]">
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-foreground/60">{Math.round(pct)}%</span>
          </div>
        );
      },
    },
    {
      key: 'actions', label: 'Actions', render: (t) => (
        <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); openEdit(t); }}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn btn-primary btn-md" onClick={openCreate}><Plus className="w-4 h-4" /> Add Target</button>
      </div>
      <DataTable
        columns={columns}
        data={targets}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No targets found"
        keyExtractor={(t) => t._id}
      />
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit Target' : 'Create Target'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="form-label">User</label>
                <select className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  <option value="">Select user...</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Target Amount *</label>
                <input className="input" type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: Number(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Currency</label>
                <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="form-label">Period</label>
                <select className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly' })}>
                  <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option>
                </select>
              </div>
              <div />
              <div>
                <label className="form-label">Start Date</label>
                <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Notes</label>
                <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={submitting || !form.userId || !form.targetAmount} onClick={handleSave}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommissionsTab() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<typeof emptyCommissionForm>(emptyCommissionForm);
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([
        salesService.getCommissions({ page: String(page), limit: '20' }),
        usersService.getUsers({ limit: '100' }),
      ]);
      if (cRes.success) {
        setCommissions(cRes.data.records ?? []);
        setTotal(cRes.data.total ?? 0);
        setTotalPages(cRes.data.totalPages ?? 1);
      }
      if (uRes.success) {
        setUsers(uRes.data.users ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]); // eslint-disable-line react-hooks/set-state-in-effect

  const userName = (id: string) => users.find((u) => u._id === id || u.id === id)?.name || id;
  const userIdOf = (id: string | { _id?: string; name: string; email?: string }) =>
    typeof id === 'string' ? id : id?._id ?? '';

  const handleApprove = async (id: string) => {
    await salesService.approveCommission(id);
    fetch();
  };

  const handlePaid = async (id: string) => {
    await salesService.markCommissionPaid(id);
    fetch();
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await api.post('/sales/commissions', form);
      setShowModal(false);
      setForm(emptyCommissionForm);
      fetch();
    } finally { setSubmitting(false); }
  };

  const commissionBadge = (status: string) => {
    const map: Record<string, string> = { pending: 'badge-warning', approved: 'badge-info', paid: 'badge-success' };
    return map[status] || 'badge';
  };

  const columns: Column<Commission>[] = [
    { key: 'dealName', label: 'Deal', sortable: true, render: (c) => <span className="font-medium text-foreground">{c.dealName}</span> },
    { key: 'user', label: 'User', render: (c) => userName(userIdOf(c.userId)) },
    { key: 'dealValue', label: 'Value', render: (c) => <span className="font-mono">{c.currency || 'USD'} {c.dealValue?.toLocaleString()}</span> },
    { key: 'commissionRate', label: 'Rate', render: (c) => <span>{c.commissionRate}%</span> },
    { key: 'commissionAmount', label: 'Amount', sortable: true, render: (c) => <span className="font-mono font-semibold">{c.currency || 'USD'} {c.commissionAmount?.toLocaleString()}</span> },
    {
      key: 'status', label: 'Status', render: (c) => (
        <span className={`badge ${commissionBadge(c.status)}`}>{c.status}</span>
      ),
    },
    {
      key: 'actions', label: 'Actions', render: (c) => (
        <div className="flex gap-1">
          {c.status === 'pending' && (
            <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleApprove(c._id); }}>Approve</button>
          )}
          {c.status === 'approved' && (
            <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handlePaid(c._id); }}>
              <CircleDollarSign className="w-3 h-3 mr-1" /> Mark Paid
            </button>
          )}
          {c.status === 'paid' && <Badge variant="success">Paid</Badge>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn btn-primary btn-md" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Add Commission</button>
      </div>
      <DataTable
        columns={columns}
        data={commissions}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No commissions found"
        keyExtractor={(c) => c._id}
      />
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Create Commission</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="form-label">User</label>
                <select className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  <option value="">Select user...</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="form-label">Deal Name *</label>
                <input className="input" value={form.dealName} onChange={(e) => setForm({ ...form, dealName: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Deal Value</label>
                <input className="input" type="number" value={form.dealValue} onChange={(e) => setForm({ ...form, dealValue: Number(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Commission Rate (%)</label>
                <input className="input" type="number" step="0.1" value={form.commissionRate} onChange={(e) => {
                  const rate = Number(e.target.value);
                  setForm({ ...form, commissionRate: rate, commissionAmount: form.dealValue * rate / 100 });
                }} />
              </div>
              <div>
                <label className="form-label">Commission Amount</label>
                <input className="input font-mono" type="number" value={form.commissionAmount} onChange={(e) => setForm({ ...form, commissionAmount: Number(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Currency</label>
                <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={submitting || !form.dealName || !form.userId} onClick={handleCreate}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


