'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { getQuotes, createQuote, convertQuoteToInvoice } from '@/services/quotes';
import { useClients } from '@/hooks/useEntityOptions';
import { getErrorMessage, isValidObjectId } from '@/lib/utils';
import type { Quote, LineItem } from '@/types';
import { Plus, FileText, X, Trash2, Replace, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'draft', 'sent', 'accepted', 'expired', 'converted'] as const;

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    draft: 'badge-info',
    sent: 'badge-primary',
    accepted: 'badge-success',
    expired: 'badge-warning',
    converted: 'badge-accent',
  };
  return `badge ${map[status] || 'badge'}`;
};

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getQuotes({
        page: String(page),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      if (res.success && res.data) {
        const data = res.data;
        setQuotes(data.quotes ?? (Array.isArray(data) ? (data as unknown as Quote[]) : []));
        setTotal(data.total ?? 0);
        setPage(data.page ?? 1);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      setError('Failed to load quotes');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleConvert = async (quoteId: string) => {
    try {
      await convertQuoteToInvoice(quoteId);
      fetchQuotes();
    } catch {
      setError('Failed to convert quote');
    }
  };

  const columns: Column<Quote>[] = [
    {
      key: 'quoteNumber',
      label: 'Quote #',
      sortable: true,
      render: (q) => <span className="font-mono text-sm">{q.quoteNumber}</span>,
    },
    {
      key: 'clientId',
      label: 'Client',
      render: (q) => <span>{typeof q.clientId === 'string' ? q.clientId : q.clientId?.name}</span>,
    },
    {
      key: 'total',
      label: 'Amount',
      sortable: true,
      render: (q) => <span className="font-mono font-medium">${q.total.toLocaleString()}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (q) => <span className={statusBadge(q.status)}>{q.status}</span>,
    },
    {
      key: 'validUntil',
      label: 'Valid Until',
      render: (q) => (
        <span className="text-foreground/60">
          {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-32',
      render: (q) => (
        <div className="flex gap-1">
          <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/quotes/${q._id}`); }}>
            View
          </button>
          {q.status === 'accepted' && (
            <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleConvert(q._id); }}>
              <Replace className="w-3 h-3" /> Invoice
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-foreground/60 text-sm mt-1">{total} total quotes</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Quote
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
        data={quotes}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        isLoading={isLoading}
        searchPlaceholder="Search quotes..."
        emptyMessage="No quotes found"
        keyExtractor={(q) => q._id}
      />

      {showModal && (
        <CreateQuoteModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchQuotes(); }}
        />
      )}
    </div>
  );
}

function CreateQuoteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [clientId, setClientId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
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

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidObjectId(clientId)) { setError('Please select a valid client.'); return; }
    if (lineItems.every((li) => !li.description.trim())) {
      setError('At least one line item is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await createQuote({ clientId, validUntil: validUntil || undefined, notes, lineItems, total } as Partial<Quote>);
      if (!res.success) {
        setError(getErrorMessage(res, 'Failed to create quote'));
        return;
      }
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create quote'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Create Quote</h2>
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
              <label className="form-label">Valid Until</label>
              <input className="input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
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
                  <input className="input flex-1" placeholder="Description" value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                  <input className="input w-20 text-center" type="number" min={1} value={item.qty}
                    onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} />
                  <input className="input w-28 text-center font-mono" type="number" min={0} step={0.01} value={item.price}
                    onChange={(e) => updateItem(idx, 'price', Number(e.target.value))} />
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
            Total: ${total.toFixed(2)}
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" className="btn btn-outline btn-md" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-md" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
