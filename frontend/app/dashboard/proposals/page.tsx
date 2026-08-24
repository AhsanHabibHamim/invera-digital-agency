'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { getProposals } from '@/services/proposals';
import type { Proposal } from '@/types';
import { FileEdit } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'submitted', 'under_review', 'quoted', 'accepted', 'declined'] as const;

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    submitted: 'badge-info',
    under_review: 'badge-warning',
    quoted: 'badge-primary',
    accepted: 'badge-success',
    declined: 'badge-destructive',
  };
  return `badge ${map[status] || 'badge'}`;
};

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getProposals({
        page: String(page),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      if (res.success && res.data) {
        const data = res.data;
        setProposals(data.proposals ?? (Array.isArray(data) ? (data as unknown as Proposal[]) : []));
        setTotal(data.total ?? 0);
        setPage(data.page ?? 1);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      setError('Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]); // eslint-disable-line react-hooks/set-state-in-effect

  const columns: Column<Proposal>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (p) => <span className="font-medium">{p.title}</span>,
    },
    {
      key: 'clientId',
      label: 'Client',
      render: (p) => <span>{typeof p.clientId === 'string' ? p.clientId : p.clientId?.name}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <span className={statusBadge(p.status)}>{p.status.replace('_', ' ')}</span>,
    },
    {
      key: 'budgetRange',
      label: 'Budget Range',
      render: (p) => <span className="text-foreground/60">{p.budgetRange || '—'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (p) => (
        <span className="text-foreground/60">{new Date(p.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (p) => (
        <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/proposals/${p._id}`); }}>
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Proposals</h1>
          <p className="text-foreground/60 text-sm mt-1">{total} total proposals</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {error && <div className="form-alert form-alert-error mb-4">{error}</div>}

      <DataTable
        columns={columns}
        data={proposals}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        isLoading={isLoading}
        searchPlaceholder="Search proposals..."
        emptyMessage="No proposals found"
        keyExtractor={(p) => p._id}
      />
    </div>
  );
}
