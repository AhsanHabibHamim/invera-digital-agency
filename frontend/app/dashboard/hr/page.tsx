'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import DashboardStats from '@/components/dashboard/DashboardStats';
import Badge from '@/components/ui/Badge';
import * as hrService from '@/services/hr';
import * as usersService from '@/services/users';
import type { Attendance, Leave, JobApplication, User } from '@/types';
import {
  Users, Clock, CalendarCheck, Briefcase, Plus, X, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';

type Tab = 'attendance' | 'leaves' | 'recruitment';

const leaveStatusBadge: Record<string, string> = {
  pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-destructive', cancelled: 'badge',
};

const appStatusBadge: Record<string, string> = {
  new: 'badge-info', screening: 'badge-primary', shortlisted: 'badge-accent',
  interview_scheduled: 'badge-warning', interviewed: 'badge', offered: 'badge-info',
  hired: 'badge-success', rejected: 'badge-destructive',
};

const attendanceStatusBadge: Record<string, string> = {
  present: 'badge-success', absent: 'badge-destructive', late: 'badge-warning', half_day: 'badge-info', holiday: 'badge',
};

export default function HRPage() {
  const [tab, setTab] = useState<Tab>('attendance');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Human Resources</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage attendance, leaves, and recruitment</p>
      </div>
      <HRStatsCards />
      <div className="flex gap-1 border-b border-border">
        {(['attendance', 'leaves', 'recruitment'] as Tab[]).map((t) => (
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
      {tab === 'attendance' && <AttendanceTab />}
      {tab === 'leaves' && <LeavesTab />}
      {tab === 'recruitment' && <RecruitmentTab />}
    </div>
  );
}

function HRStatsCards() {
  const [stats, setStats] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    hrService.getHRStats().then((res) => {
      if (res.success) setStats(res.data);
    }).catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <DashboardStats
      stats={[
        { label: 'Total Employees', value: stats.totalEmployees, icon: <Users size={18} /> },
        { label: 'Active Leaves', value: stats.activeLeaves, icon: <Clock size={18} /> },
        { label: 'Pending Leaves', value: stats.pendingLeaves, icon: <CalendarCheck size={18} /> },
        { label: 'New Applications', value: stats.newApplications, icon: <Briefcase size={18} /> },
      ]}
    />
  );
}

function AttendanceTab() {
  const [attendance, setAttendance] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (dateFilter) params.date = dateFilter;
      const [aRes, uRes] = await Promise.all([
        hrService.getAttendance(params),
        usersService.getUsers({ limit: '100' }),
      ]);
      if (aRes.success) {
        setAttendance(aRes.data.records ?? []);
        setTotal(aRes.data.total ?? 0);
        setTotalPages(aRes.data.totalPages ?? 1);
      }
      if (uRes.success) {
        setUsers(uRes.data.users ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, [page, dateFilter]);

  useEffect(() => { fetch(); }, [fetch]); // eslint-disable-line react-hooks/set-state-in-effect

  const userName = (id: string) => users.find((u) => u._id === id || u.id === id)?.name || id;

  const columns: Column<any>[] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
    { key: 'user', label: 'User', render: (a) => <span className="font-medium text-foreground">{userName(a.userId)}</span> },
    { key: 'date', label: 'Date', sortable: true, render: (a) => new Date(a.date).toLocaleDateString() },
    { key: 'checkIn', label: 'Check In', render: (a) => a.checkIn ? <span className="font-mono text-sm">{a.checkIn}</span> : <span className="text-foreground/40">—</span> },
    { key: 'checkOut', label: 'Check Out', render: (a) => a.checkOut ? <span className="font-mono text-sm">{a.checkOut}</span> : <span className="text-foreground/40">—</span> },
    {
      key: 'status', label: 'Status', render: (a) => (
        <span className={`badge ${attendanceStatusBadge[a.status] || 'badge'}`}>{a.status}</span>
      ),
    },
    {
      key: 'actions', label: 'Actions', render: (a) => (
        <button className="btn btn-ghost btn-sm text-foreground/40">View</button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input className="input w-auto" type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} />
      </div>
      <DataTable
        columns={columns}
        data={attendance}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No attendance records found"
        keyExtractor={(a) => a._id}
      />
    </div>
  );
}

function LeavesTab() {
  const [leaves, setLeaves] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ userId: '', leaveType: 'annual', startDate: '', endDate: '', reason: '' }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      const [lRes, uRes] = await Promise.all([
        hrService.getLeaves(params),
        usersService.getUsers({ limit: '100' }),
      ]);
      if (lRes.success) {
        setLeaves(lRes.data.records ?? []);
        setTotal(lRes.data.total ?? 0);
        setTotalPages(lRes.data.totalPages ?? 1);
      }
      if (uRes.success) {
        setUsers(uRes.data.users ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]); // eslint-disable-line react-hooks/set-state-in-effect

  const userName = (id: string) => users.find((u) => u._id === id || u.id === id)?.name || id;

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    await hrService.approveLeave(id, { status });
    fetch();
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const days = form.startDate && form.endDate ? Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;
      await hrService.createLeave({ ...form, totalDays: days });
      setShowModal(false);
      setForm({ userId: '', leaveType: 'annual', startDate: '', endDate: '', reason: '' });
      fetch();
    } finally { setSubmitting(false); }
  };

  const columns: Column<any>[] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
    { key: 'user', label: 'User', render: (l) => <span className="font-medium text-foreground">{userName(l.userId)}</span> },
    { key: 'leaveType', label: 'Type', render: (l) => <Badge>{l.leaveType}</Badge> },
    { key: 'dates', label: 'Dates', render: (l) => <span className="text-sm">{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</span> },
    { key: 'totalDays', label: 'Days', render: (l) => <span className="font-mono">{l.totalDays}</span> },
    {
      key: 'status', label: 'Status', render: (l) => (
        <span className={`badge ${leaveStatusBadge[l.status] || 'badge'}`}>{l.status}</span>
      ),
    },
    {
      key: 'actions', label: 'Actions', render: (l) => (
        <div className="flex gap-1">
          {l.status === 'pending' && (
            <>
              <button className="btn btn-outline btn-sm text-success" onClick={(e) => { e.stopPropagation(); handleStatusChange(l._id, 'approved'); }}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
              </button>
              <button className="btn btn-outline btn-sm text-destructive" onClick={(e) => { e.stopPropagation(); handleStatusChange(l._id, 'rejected'); }}>
                <XCircle className="w-3 h-3 mr-1" /> Reject
              </button>
            </>
          )}
          {l.status !== 'pending' && <span className="text-xs text-foreground/40">{l.status}</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn btn-primary btn-md" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Apply Leave</button>
      </div>
      <DataTable
        columns={columns}
        data={leaves}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No leave records found"
        keyExtractor={(l) => l._id}
      />
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Apply Leave</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="form-label">Employee</label>
                <select className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  <option value="">Select...</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="form-label">Leave Type</label>
                <select className="input" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
                  <option value="annual">Annual</option><option value="sick">Sick</option><option value="personal">Personal</option>
                  <option value="maternity">Maternity</option><option value="paternity">Paternity</option><option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Start Date *</label>
                <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="form-label">End Date *</label>
                <input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Reason</label>
                <textarea className="input" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={submitting || !form.userId || !form.startDate || !form.endDate} onClick={handleCreate}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecruitmentTab() {
  const [applications, setApplications] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ candidateName: '', position: '', email: '', phone: '', experience: '', source: '' }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [submitting, setSubmitting] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const statusOptions = ['new', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'];

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      const res = await hrService.getApplications(params);
      if (res.success) {
        setApplications(res.data.records ?? []);
        setTotal(res.data.total ?? 0);
        setTotalPages(res.data.totalPages ?? 1);
      }
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleStatusChange = async (id: string, status: string) => {
    await hrService.updateApplication(id, { status } as Partial<JobApplication>);
    setStatusDropdown(null);
    fetch();
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await hrService.createApplication(form);
      setShowModal(false);
      setForm({ candidateName: '', position: '', email: '', phone: '', experience: '', source: '' });
      fetch();
    } finally { setSubmitting(false); }
  };

  const columns: Column<any>[] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
    { key: 'candidateName', label: 'Candidate', sortable: true, render: (a) => <span className="font-medium text-foreground">{a.candidateName}</span> },
    { key: 'position', label: 'Position', sortable: true, render: (a) => <span>{a.position}</span> },
    {
      key: 'status', label: 'Status', render: (a) => (
        <div className="relative">
          <button
            className={`badge ${appStatusBadge[a.status] || 'badge'} cursor-pointer`}
            onClick={(e) => { e.stopPropagation(); setStatusDropdown(statusDropdown === a._id ? null : a._id); }}
          >
            {a.status.replace(/_/g, ' ')}
          </button>
          {statusDropdown === a._id && (
            <div className="dropdown mt-1" style={{ position: 'absolute', zIndex: 50 }}>
              {statusOptions.map((s) => (
                <button key={s} className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleStatusChange(a._id, s); }}>
                  <span className={`badge ${appStatusBadge[s]}`}>{s.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
    { key: 'createdAt', label: 'Applied', sortable: true, render: (a) => new Date(a.createdAt).toLocaleDateString() },
    {
      key: 'actions', label: 'Actions', render: (a) => (
        <button className="btn btn-ghost btn-sm text-foreground/40">View</button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn btn-primary btn-md" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Add Application</button>
      </div>
      <DataTable
        columns={columns}
        data={applications}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No applications found"
        keyExtractor={(a) => a._id}
      />
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Add Application</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="form-label">Candidate Name *</label>
                <input className="input" value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Position *</label>
                <input className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Experience</label>
                <input className="input" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 3 years" />
              </div>
              <div>
                <label className="form-label">Source</label>
                <input className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g. LinkedIn" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={submitting || !form.candidateName || !form.position || !form.email} onClick={handleCreate}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
