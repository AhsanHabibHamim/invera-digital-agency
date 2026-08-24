'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getQuote, sendQuote, updateQuote, deleteQuote, convertQuoteToInvoice } from '@/services/quotes';
import type { Quote } from '@/types';
import { ArrowLeft, Send, Replace, Edit3, Trash2, FileText, X } from 'lucide-react';

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

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [showConfirm, setShowConfirm] = useState<'send' | 'convert' | 'delete' | null>(null);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getQuote(id);
        setQuote(res.data);
        setNotes(res.data?.notes || '');
      } catch {
        setError('Failed to load quote');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p className="text-foreground/50 text-sm">Loading quote...</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="empty-state">
        <FileText className="empty-state-icon" />
        <p className="empty-state-title">{error || 'Quote not found'}</p>
        <button className="btn btn-outline btn-sm" onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  const handleAction = async (action: string, fn: () => Promise<unknown>) => {
    setActionLoading(action);
    setShowConfirm(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await fn();
      if (res?.data) {
        setQuote(res.data);
      } else {
        const refreshed = await getQuote(id);
        setQuote(refreshed.data);
      }
    } catch {
      setError(`Failed to ${action} quote`);
    } finally {
      setActionLoading('');
    }
  };

  const handleSaveNotes = async () => {
    try {
      const res = await updateQuote(id, { notes } as Partial<Quote>);
      setQuote(res.data);
      setEditing(false);
    } catch {
      setError('Failed to update notes');
    }
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {error && <div className="form-alert form-alert-error mb-4">{error}</div>}

      <div className="card-dashboard">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">Quote {quote.quoteNumber}</h1>
              <span className={statusBadge(quote.status)}>{quote.status}</span>
            </div>
            <p className="text-foreground/60 text-sm">
              Created {new Date(quote.createdAt).toLocaleDateString()}
              {quote.validUntil && <> · Valid until {new Date(quote.validUntil).toLocaleDateString()}</>}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            {quote.status === 'draft' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowConfirm('send')}
                disabled={actionLoading === 'send'}>
                <Send className="w-4 h-4" /> {actionLoading === 'send' ? 'Sending...' : 'Send'}
              </button>
            )}
            {quote.status === 'accepted' && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowConfirm('convert')}
                disabled={actionLoading === 'convert'}>
                <Replace className="w-4 h-4" /> {actionLoading === 'convert' ? 'Converting...' : 'Convert to Invoice'}
              </button>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(!editing)}>
              <Edit3 className="w-4 h-4" /> Edit
            </button>
            {(quote.status === 'draft' || quote.status === 'sent') && (
              <button className="btn btn-ghost btn-icon text-destructive" onClick={() => setShowConfirm('delete')}
                disabled={actionLoading === 'delete'}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="form-label">Client</p>
            <p className="font-medium">{typeof quote.clientId === 'string' ? quote.clientId : quote.clientId?.name}</p>
          </div>
          {quote.projectId && (
            <div>
              <p className="form-label">Project</p>
              <p className="font-medium">{typeof quote.projectId === 'string' ? quote.projectId : quote.projectId?.title}</p>
            </div>
          )}
        </div>

        {editing ? (
          <div className="mb-6">
            <label className="form-label">Notes</label>
            <textarea className="input mb-2" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={handleSaveNotes}>Save</button>
              <button className="btn btn-outline btn-sm" onClick={() => { setEditing(false); setNotes(quote.notes || ''); }}>Cancel</button>
            </div>
          </div>
        ) : quote.notes ? (
          <div className="mb-6 p-3 rounded-lg bg-surface border border-border">
            <p className="form-label">Notes</p>
            <p className="text-sm">{quote.notes}</p>
          </div>
        ) : null}

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-center w-20">Qty</th>
                <th className="text-right w-28">Price</th>
                <th className="text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((li, i) => (
                <tr key={i}>
                  <td>{li.description}</td>
                  <td className="text-center">{li.qty}</td>
                  <td className="text-right font-mono">${li.price.toFixed(2)}</td>
                  <td className="text-right font-mono">${(li.qty * li.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4 text-lg font-bold font-mono">
          Total: ${quote.total.toFixed(2)}
        </div>
      </div>

      {showConfirm === 'send' && (
        <ConfirmDialog title="Send Quote" message="Send this quote to the client?" loading={actionLoading === 'send'}
          onConfirm={() => handleAction('send', () => sendQuote(id))}
          onCancel={() => setShowConfirm(null)} />
      )}
      {showConfirm === 'convert' && (
        <ConfirmDialog title="Convert to Invoice" message="Create an invoice from this quote?" loading={actionLoading === 'convert'}
          onConfirm={() => handleAction('convert', () => convertQuoteToInvoice(id))}
          onCancel={() => setShowConfirm(null)} />
      )}
      {showConfirm === 'delete' && (
        <ConfirmDialog title="Delete Quote" message="This action cannot be undone." loading={actionLoading === 'delete'}
          onConfirm={() => handleAction('delete', async () => { await deleteQuote(id); router.push('/dashboard/quotes'); })}
          onCancel={() => setShowConfirm(null)} />
      )}
    </div>
  );
}

function ConfirmDialog({ title, message, loading, onConfirm, onCancel }: {
  title: string; message: string; loading: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-foreground/60 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn btn-outline btn-sm" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
