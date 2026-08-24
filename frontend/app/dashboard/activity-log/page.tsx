'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { getActivityLog } from '@/services/activity-log';
import type { ActivityLog } from '@/types';
import { Search } from 'lucide-react';

const ACTION_OPTIONS = [
  'all', 'create_project', 'update_project', 'archive_project', 'assign_team',
  'create_quote', 'update_quote', 'delete_quote', 'create_invoice',
  'create_lead', 'update_lead', 'update_lead_status', 'assign_lead', 'convert_lead', 'delete_lead', 'reply_lead',
  'create_ticket', 'assign_ticket', 'close_ticket',
  'create_user', 'update_user', 'deactivate_user', 'assign_role', 'remove_role',
  'create_service', 'update_service', 'delete_service',
  'review_proposal', 'approve_proposal',
];
const TARGET_TYPE_OPTIONS = ['all', 'Lead', 'Project', 'Proposal', 'Quote', 'Invoice', 'Service', 'Ticket', 'User'];

function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: '30' };
      if (actionFilter) params.action = actionFilter;
      if (targetTypeFilter) params.targetType = targetTypeFilter;
      const res = await getActivityLog(params);
      if (res.success) {
        setLogs(res.data.logs ?? []);
        setTotal(res.data.total ?? 0);
        setTotalPages(res.data.totalPages ?? 1);
      }
    } catch {
      setError('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, targetTypeFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]); // eslint-disable-line react-hooks/set-state-in-effect

  const columns: Column<ActivityLog>[] = [
    {
      key: 'userId',
      label: 'User',
      render: (l) =>
        (typeof l.userId === 'string' ? l.userId : l.userId?.name) || <span className="text-foreground/40">—</span>,
    },
    {
      key: 'action',
      label: 'Action',
      render: (l) => (
        <span className="badge badge-primary capitalize">{l.action.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'targetType',
      label: 'Target',
      render: (l) => (
        <span className="capitalize">{l.targetType} {l.targetId ? `#${l.targetId.slice(-6)}` : ''}</span>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (l) => l.details || <span className="text-foreground/40">—</span>,
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (l) => (
        <span className="text-sm text-foreground/60" title={new Date(l.timestamp).toLocaleString()}>
          {relativeTime(l.timestamp)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="mt-1 text-sm text-neutral-500">Track all system activity</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            className="input pl-9"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
          />
        </div>
        <select className="input w-auto" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); }}>
          <option value="">All Actions</option>
          {ACTION_OPTIONS.filter((a) => a !== 'all').map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <select className="input w-auto" value={targetTypeFilter} onChange={(e) => { setTargetTypeFilter(e.target.value); }}>
          <option value="">All Targets</option>
          {TARGET_TYPE_OPTIONS.filter((t) => t !== 'all').map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      <DataTable<ActivityLog>
        columns={columns}
        data={search
          ? logs.filter((l) => {
              const q = search.toLowerCase();
              const user = typeof l.userId === 'string' ? l.userId : l.userId?.name ?? '';
              return (
                user.toLowerCase().includes(q) ||
                (l.details ?? '').toLowerCase().includes(q) ||
                l.action.toLowerCase().includes(q)
              );
            })
          : logs}
        total={search
          ? logs.filter((l) => {
              const q = search.toLowerCase();
              const user = typeof l.userId === 'string' ? l.userId : l.userId?.name ?? '';
              return (
                user.toLowerCase().includes(q) ||
                (l.details ?? '').toLowerCase().includes(q) ||
                l.action.toLowerCase().includes(q)
              );
            }).length
          : total}
        page={search ? 1 : page}
        totalPages={search ? 1 : totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No activity found"
        keyExtractor={(l) => l._id}
        searchPlaceholder=""
      />
    </div>
  );
}
