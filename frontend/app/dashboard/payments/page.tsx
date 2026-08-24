'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  listPayments, confirmPayment, rejectPayment,
  type PaymentSubmission,
} from '@/services/invoices';
import type { PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import {
  Wallet, Loader2, CheckCircle2, XCircle, Clock, RefreshCw,
} from 'lucide-react';

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  bkash: 'bKash',
  nagad: 'Nagad',
  other: 'Other',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-success',
  rejected: 'badge-destructive',
};

export default function PaymentsQueuePage() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPayments({ status, page: String(page) });
      if (res.success && res.data) {
        setSubmissions(res.data.submissions || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleConfirm = async (id: string) => {
    setActionId(id);
    try {
      const res = await confirmPayment(id);
      if (res.success) {
        toast.success('Payment confirmed — invoice marked as paid and client notified.');
        fetchPayments();
      } else {
        toast.error(res.message || 'Failed to confirm');
      }
    } catch {
      toast.error('Failed to confirm payment');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting?.reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActionId(rejecting.id);
    try {
      const res = await rejectPayment(rejecting.id, rejecting.reason.trim());
      if (res.success) {
        toast.success('Payment rejected — client has been notified.');
        setRejecting(null);
        fetchPayments();
      } else {
        toast.error(res.message || 'Failed to reject');
      }
    } catch {
      toast.error('Failed to reject payment');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-xs">
        <div>
          <h1 className="text-h3 font-bold text-foreground">Manual Payments</h1>
          <p className="text-body-small text-foreground/60">
            Verify bank transfer / bKash / Nagad submissions from clients.
          </p>
        </div>
        <button className="icon-btn" onClick={fetchPayments} aria-label="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex gap-2xs">
        {['pending', 'confirmed', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            className={`badge cursor-pointer capitalize ${status === s ? 'badge-primary' : ''}`}
            onClick={() => { setStatus(s); setPage(1); }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">
          <Wallet className="empty-state-icon" />
          <p className="empty-state-title">No {status !== 'all' ? status : ''} submissions</p>
          <p className="text-caption text-foreground/50">
            Client payment submissions will appear here for verification.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Method</th>
                <th>Ref</th>
                <th className="text-right">Amount</th>
                <th>Screenshot</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s._id}>
                  <td>
                    <span className="font-mono text-small">
                      {typeof s.invoiceId === 'object' ? s.invoiceId?.invoiceNumber ?? String(s.invoiceId?._id).slice(-8) : String(s.invoiceId).slice(-8)}
                    </span>
                  </td>
                  <td>{(s.clientId as unknown as { name?: string })?.name ?? '—'}</td>
                  <td>{METHOD_LABELS[s.method] ?? s.method}</td>
                  <td><span className="font-mono text-caption">{s.transactionRef}</span></td>
                  <td className="text-right font-mono">{s.amount != null ? `$${Number(s.amount).toFixed(2)}` : '—'}</td>
                  <td>
                    {s.screenshotUrl ? (
                      <a href={s.screenshotUrl} target="_blank" rel="noreferrer" className="inline-block">
                        <Image src={s.screenshotUrl} alt="payment proof" width={40} height={40} unoptimized
                          className="rounded border border-border object-cover" />
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[s.status] ?? ''}`}>
                      {s.status === 'pending' && <Clock className="mr-2xs inline w-xs h-xs" />}
                      {s.status}
                    </span>
                    {s.rejectionReason && (
                      <p className="text-caption text-destructive mt-2xs max-w-40 truncate" title={s.rejectionReason}>
                        {s.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {s.status === 'pending' ? (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleConfirm(s._id)}
                          disabled={actionId === s._id}
                          title="Confirm payment"
                        >
                          {actionId === s._id ? <Loader2 className="w-xs h-xs animate-spin" /> : <CheckCircle2 className="w-xs h-xs" />}
                        </button>{' '}
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setRejecting({ id: s._id, reason: '' })}
                          disabled={!!actionId}
                          title="Reject payment"
                        >
                          <XCircle className="w-xs h-xs text-destructive" />
                        </button>
                      </>
                    ) : (
                      <span className="text-caption text-foreground/40">
                        {s.reviewedByName ? `by ${s.reviewedByName}` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-sm">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-caption text-foreground/60">Page {page} of {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-sm" onClick={() => setRejecting(null)}>
          <div className="card-dashboard w-full max-w-md flex flex-col gap-xs" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-h4 font-bold">Reject payment</h2>
            <p className="text-caption text-foreground/60">
              Explain why this submission cannot be verified. The client receives this by email.
            </p>
            <textarea
              className="form-input min-h-24"
              placeholder="e.g. Transaction reference not found in our bank statement."
              value={rejecting.reason}
              onChange={(e) => setRejecting({ ...rejecting, reason: e.target.value })}
            />
            <div className="flex justify-end gap-2xs">
              <button className="btn btn-outline btn-sm" onClick={() => setRejecting(null)}>Cancel</button>
              <button className="btn btn-destructive btn-sm" onClick={handleReject} disabled={actionId === rejecting.id}>
                {actionId === rejecting.id ? <Loader2 className="w-xs h-xs animate-spin" /> : <XCircle className="w-xs h-xs" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
