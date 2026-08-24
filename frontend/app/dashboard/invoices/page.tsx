'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { getInvoices, createInvoice } from '@/services/invoices';
import { useClients } from '@/hooks/useEntityOptions';
import { getErrorMessage, isValidObjectId } from '@/lib/utils';
import type { Invoice, InvoiceLineItem } from '@/types';
import { Plus, Receipt, Trash2, X, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    draft: 'badge-info',
    sent: 'badge-primary',
    paid: 'badge-success',
    overdue: 'badge-destructive',
    cancelled: 'badge-warning',
  };
  return `badge ${map[status] || 'badge'}`;
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getInvoices({
        page: String(page),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      if (res.success && res.data) {
        const data = res.data;
        setInvoices(data.invoices ?? (Array.isArray(data) ? (data as unknown as Invoice[]) : []));
        setTotal(data.total ?? 0);
        setPage(data.page ?? 1);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      setError('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]); // eslint-disable-line react-hooks/set-state-in-effect

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
      render: (inv) => <span className="font-mono text-sm">{inv.invoiceNumber}</span>,
    },
    {
      key: 'clientId',
      label: 'Client',
      render: (inv) => <span>{typeof inv.clientId === 'string' ? inv.clientId : inv.clientId?.name}</span>,
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
      render: (inv) => <span className={statusBadge(inv.status)}>{inv.status}</span>,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (inv) => (
        <span className="text-foreground/60">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (inv) => (
        <button
          className="btn btn-outline btn-sm"
          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/invoices/${inv._id}`); }}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-foreground/60 text-sm mt-1">{total} total invoices</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="form-alert form-alert-error mb-4">{error}</div>}

      <DataTable
        columns={columns}
        data={invoices}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        isLoading={isLoading}
        searchPlaceholder="Search invoices..."
        emptyMessage="No invoices found"
        keyExtractor={(inv) => inv._id}
      />

      {showModal && (
        <CreateInvoiceModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchInvoices(); }}
        />
      )}
    </div>
  );
}

function CreateInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: '', qty: 1, price: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { clients, loading: clientsLoading } = useClients();

  const total = lineItems.reduce((sum, item) => sum + item.qty * item.price, 0);

  const addItem = () => setLineItems((prev) => [...prev, { description: '', qty: 1, price: 0 }]);

  const removeItem = (idx: number) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidObjectId(clientId)) { setError('Please select a valid client.'); return; }
    if (lineItems.length === 0 || lineItems.every((li) => !li.description.trim())) {
      setError('At least one line item is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await createInvoice({ clientId, dueDate: dueDate || undefined, currency, lineItems, total } as Partial<Invoice>);
      if (!res.success) {
        setError(getErrorMessage(res, 'Failed to create invoice'));
        return;
      }
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create invoice'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Create Invoice</h2>
          <button className="btn btn-ghost btn-icon p-1" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="form-alert form-alert-error mb-4" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Client *</label>
            <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={clientsLoading}>
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="form-label">Due Date</label>
              <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="w-32">
              <label className="form-label">Currency</label>
              <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Line Items</label>
              <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input
                    className="input flex-1"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                  <input
                    className="input w-20 text-center"
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                  />
                  <input
                    className="input w-28 text-center font-mono"
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.price}
                    onChange={(e) => updateItem(idx, 'price', Number(e.target.value))}
                  />
                  <div className="flex items-center justify-center w-20 text-sm font-mono text-foreground/70 pt-2">
                    {(item.qty * item.price).toFixed(2)}
                  </div>
                  <button type="button" className="btn btn-ghost btn-icon p-1 mt-1" onClick={() => removeItem(idx)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end text-lg font-bold font-mono border-t border-border pt-4">
            Total: {currency} {total.toFixed(2)}
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" className="btn btn-outline btn-md" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-md" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
