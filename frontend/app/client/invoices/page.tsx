'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { TableSkeleton } from '@/components/Skeleton';
import { getInvoices } from '@/services/invoices';
import type { Invoice } from '@/types';
import { Receipt, Search } from 'lucide-react';

const statusBadge: Record<string, string> = {
  draft: 'badge-info',
  sent: 'badge-primary',
  paid: 'badge-success',
  overdue: 'badge-destructive',
  cancelled: 'badge-warning',
};

export default function ClientInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getInvoices({
        page: String(page),
        ...(search ? { search } : {}),
      });
      if (res.success && res.data) {
        const data = res.data;
        setInvoices(data.invoices ?? (Array.isArray(data) ? (data as unknown as Invoice[]) : []));
        setTotal(data.total ?? 0);
        setPage(data.page ?? 1);
        setTotalPages(data.totalPages ?? 1);
      } else {
        setError(res.message || 'Failed to load invoices');
      }
    } catch {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]); // eslint-disable-line react-hooks/set-state-in-effect
  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
      render: (inv) => <span className="font-mono text-sm font-medium">{inv.invoiceNumber}</span>,
    },
    {
      key: 'total',
      label: 'Amount',
      sortable: true,
      render: (inv) => (
        <span className="font-mono font-medium">
          {inv.currency || 'USD'} {inv.total.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (inv) => <span className={`badge ${statusBadge[inv.status] || 'badge'}`}>{inv.status}</span>,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (inv) => (
        <span className="text-foreground/60">
          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-20',
      render: (inv) => (
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => { e.stopPropagation(); router.push(`/client/invoices/${inv._id}`); }}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Invoices</h1>
        <p className="mt-1 text-sm text-neutral-500">View and manage your invoices</p>
      </div>

      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input
          className="input pl-9"
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : invoices.length === 0 && !error ? (
        <div className="card-dashboard">
          <div className="empty-state">
            <Receipt className="empty-state-icon" />
            <p className="empty-state-title">No invoices found</p>
            <p className="empty-state-desc">Your invoices will appear here once generated.</p>
          </div>
        </div>
      ) : (
        <DataTable<Invoice>
          columns={columns}
          data={invoices}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearch={(q) => { setSearch(q); setPage(1); }}
          isLoading={false}
          searchPlaceholder=""
          emptyMessage="No invoices found"
          keyExtractor={(inv) => inv._id}
        />
      )}
    </div>
  );
}
