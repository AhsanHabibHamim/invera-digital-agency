'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getInvoice, downloadInvoicePdf, submitPayment, getMyPaymentSubmissions,
  getPublicPaymentInfo,
  type PaymentSubmission,
  type PublicPaymentConfig,
} from '@/services/invoices';
import type { Invoice } from '@/types';
import { toast } from 'sonner';
import {
  ArrowLeft, Receipt, Loader2, Download, Landmark, CheckCircle2, Upload, XCircle, Clock,
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  draft: 'badge-info',
  sent: 'badge-primary',
  paid: 'badge-success',
  overdue: 'badge-destructive',
  cancelled: 'badge-warning',
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  bkash: 'bKash',
  nagad: 'Nagad',
  other: 'Other',
};

export default function ClientInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PublicPaymentConfig | null>(null);
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');

  // Manual payment form state
  const [showPayForm, setShowPayForm] = useState(false);
  const [method, setMethod] = useState('bank_transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [invRes, payRes, subRes] = await Promise.all([
        getInvoice(id),
        getPublicPaymentInfo().catch(() => ({ success: false }) as never),
        getMyPaymentSubmissions().catch(() => ({ success: false }) as never),
      ]);
      if (invRes.success) setInvoice(invRes.data);
      else setError(invRes.message || 'Failed to load invoice');
      if (payRes.success) setPaymentConfig((payRes as { data: PublicPaymentConfig }).data);
      if (subRes.success) {
        setSubmissions(
          ((subRes as { data: PaymentSubmission[] }).data || []).filter(
            (s) => s.invoiceId === id || (s.invoiceId as unknown as { _id?: string })?._id === id,
          ),
        );
      }
    } catch {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]); // eslint-disable-line react-hooks/set-state-in-effect

  const pendingSubmission = submissions.find((s) => s.status === 'pending');

  const handleSubmitPayment = async () => {
    if (!invoice) return;
    if (!transactionRef.trim()) {
      toast.error('Transaction reference is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitPayment(
        invoice._id,
        { method, transactionRef: transactionRef.trim() },
        screenshot,
      );
      if (res.success) {
        toast.success('Payment submitted! We will verify it shortly.');
        setShowPayForm(false);
        setTransactionRef('');
        setScreenshot(null);
        await fetchInvoice();
      } else {
        toast.error(res.message || 'Could not submit payment');
      }
    } catch {
      toast.error('Could not submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadInvoicePdf(id);
    } catch {
      setDownloadError('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="empty-state">
        <Receipt className="empty-state-icon" />
        <p className="empty-state-title">{error}</p>
        <button className="btn btn-outline btn-md mt-sm" onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  if (!invoice) return null;

  const subtotal = invoice.lineItems.reduce((s, li) => s + li.qty * li.price, 0);
  const taxAmount = invoice.tax ?? 0;
  const discountAmount = invoice.discountAmount ?? 0;
  const grandTotal = subtotal + taxAmount - discountAmount;
  const isPayable = invoice.status === 'sent' || invoice.status === 'overdue';

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center gap-xs">
        <Link href="/client/invoices" className="icon-btn" aria-label="Back to invoices">
          <ArrowLeft className="w-sm h-sm" />
        </Link>
        <div className="flex items-center gap-xs">
          <h1 className="text-h3 font-bold text-foreground">Invoice {invoice.invoiceNumber}</h1>
          <span className={`badge ${statusBadge[invoice.status] ?? 'badge'}`}>{invoice.status}</span>
        </div>
      </div>

      {downloadError && <div className="form-alert form-alert-error">{downloadError}</div>}

      <div className="card-dashboard flex flex-col gap-sm">
        <div className="flex flex-wrap items-center justify-between gap-xs border-b border-border pb-sm">
          <p className="text-body-small text-foreground/60">
            Created {new Date(invoice.createdAt).toLocaleDateString()}
            {invoice.dueDate && <> · Due {new Date(invoice.dueDate).toLocaleDateString()}</>}
          </p>
          <button className="btn btn-outline btn-sm" onClick={handleDownload}>
            <Download className="w-sm h-sm" /> PDF
          </button>
        </div>

        {invoice.status === 'paid' ? (
          <div className="flex items-center gap-xs text-success">
            <CheckCircle2 className="w-md h-md" />
            <div>
              <p className="text-small font-semibold">Paid in full — thank you!</p>
              <p className="text-caption text-foreground/50">
                {invoice.paidAt && `Paid on ${new Date(invoice.paidAt).toLocaleDateString()}`}
                {invoice.paymentMethod && ` via ${METHOD_LABELS[invoice.paymentMethod] ?? invoice.paymentMethod}`}
              </p>
            </div>
          </div>
        ) : isPayable ? (
          <div className="flex flex-col gap-xs rounded-lg bg-surface border border-border p-sm">
            <div className="flex items-center justify-between gap-xs flex-wrap">
              <div className="flex items-center gap-xs">
                <Landmark className="w-md h-md text-primary" />
                <div>
                  <p className="text-small font-semibold text-foreground">
                    Amount due: {invoice.currency ?? 'USD'} {grandTotal.toFixed(2)}
                  </p>
                  <p className="text-caption text-foreground/50">
                    Pay via bank transfer, bKash or Nagad — then submit your transaction details below for verification.
                  </p>
                </div>
              </div>
              {pendingSubmission ? (
                <span className="badge badge-warning inline-flex items-center gap-2xs">
                  <Clock className="w-xs h-xs" /> Verification pending
                </span>
              ) : (
                !showPayForm && (
                  <button className="btn btn-primary btn-md" onClick={() => setShowPayForm(true)}>
                    <Landmark className="w-sm h-sm" /> Submit Payment
                  </button>
                )
              )}
            </div>

            {pendingSubmission && (
              <p className="text-caption text-foreground/60">
                Ref <strong>{pendingSubmission.transactionRef}</strong> ({METHOD_LABELS[pendingSubmission.method]}) is awaiting admin verification. You will be notified once confirmed.
              </p>
            )}

            {!showPayForm && paymentConfig && (
              <details className="rounded-lg border border-border p-xs">
                <summary className="text-caption font-semibold cursor-pointer">View payment instructions</summary>
                <div className="flex flex-col gap-2xs mt-2xs text-caption text-foreground/70">
                  {paymentConfig.bankAccounts?.map((acc, i) => (
                    <p key={i}>
                      <strong>{acc.bankName}</strong> — A/C {acc.accountNumber}
                      {acc.branch ? ` (${acc.branch})` : ''}
                      {acc.routing ? ` · Routing ${acc.routing}` : ''}
                    </p>
                  ))}
                  {paymentConfig.bkashNumber && (
                    <p><strong>bKash:</strong> {paymentConfig.bkashNumber}{paymentConfig.bkashType ? ` (${paymentConfig.bkashType})` : ''}</p>
                  )}
                  {paymentConfig.nagadNumber && <p><strong>Nagad:</strong> {paymentConfig.nagadNumber}</p>}
                  {paymentConfig.instructions && <p>{paymentConfig.instructions}</p>}
                </div>
              </details>
            )}

            {showPayForm && (
              <div className="flex flex-col gap-xs rounded-lg border border-border bg-background/50 p-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs">
                  <label className="flex flex-col gap-2xs">
                    <span className="text-caption font-medium text-foreground/70">Payment method</span>
                    <select
                      className="form-input"
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2xs">
                    <span className="text-caption font-medium text-foreground/70">Transaction reference *</span>
                    <input
                      className="form-input"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. TrxID / TXN12345"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-2xs">
                  <span className="text-caption font-medium text-foreground/70">
                    Screenshot (optional, jpg/png/webp ≤ 5MB)
                  </span>
                  <input
                    className="form-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                  />
                </label>
                <div className="flex gap-2xs">
                  <button className="btn btn-primary btn-sm" onClick={handleSubmitPayment} disabled={submitting}>
                    {submitting ? <Loader2 className="w-sm h-sm animate-spin" /> : <Upload className="w-sm h-sm" />}
                    Submit for verification
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowPayForm(false)}>
                    <XCircle className="w-sm h-sm" /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {invoice.notes && (
          <div className="rounded-lg bg-surface border border-border p-xs">
            <p className="text-caption font-semibold text-foreground/50 mb-2xs">Notes</p>
            <p className="text-body-small text-foreground/80">{invoice.notes}</p>
          </div>
        )}

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
              {invoice.lineItems.map((li, i) => (
                <tr key={i}>
                  <td>{li.description}</td>
                  <td className="text-center">{li.qty}</td>
                  <td className="text-right font-mono">{li.price.toFixed(2)}</td>
                  <td className="text-right font-mono">{(li.qty * li.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end gap-2xs text-body-small">
          <div className="flex justify-between w-64">
            <span className="text-foreground/60">Subtotal</span>
            <span className="font-mono">{invoice.currency ?? 'USD'} {subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between w-64">
              <span className="text-foreground/60">Discount {invoice.discountCode && `(${invoice.discountCode})`}</span>
              <span className="font-mono text-destructive">-{discountAmount.toFixed(2)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between w-64">
              <span className="text-foreground/60">Tax</span>
              <span className="font-mono">{taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between w-64 border-t border-border pt-2xs text-h5 font-bold">
            <span>Total</span>
            <span className="font-mono">{invoice.currency ?? 'USD'} {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
