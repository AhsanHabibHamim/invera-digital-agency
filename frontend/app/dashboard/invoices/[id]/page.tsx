'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getInvoice, sendInvoice, voidInvoice, downloadInvoicePdf,
} from '@/services/invoices';
import type { Invoice } from '@/types';
import { ArrowLeft, Send, Ban, Download, FileText } from 'lucide-react';

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

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [showConfirm, setShowConfirm] = useState<'send' | 'void' | 'delete' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getInvoice(id);
        setInvoice(res.data as Invoice);
      } catch {
        setError('Failed to load invoice');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p className="text-foreground/50 text-sm">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="empty-state">
        <FileText className="empty-state-icon" />
        <p className="empty-state-title">{error || 'Invoice not found'}</p>
        <button className="btn btn-outline btn-sm" onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  const subtotal = invoice.lineItems.reduce((s, li) => s + li.qty * li.price, 0);
  const taxAmount = invoice.tax ?? 0;
  const discountAmount = invoice.discountAmount ?? 0;
  const grandTotal = subtotal + taxAmount - discountAmount;

  const handleAction = async (action: string, fn: () => Promise<unknown>) => {
    setActionLoading(action);
    setShowConfirm(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await fn();
      if (res?.data) {
        setInvoice(res.data);
      } else {
        const refreshed = await getInvoice(id);
        setInvoice(refreshed.data);
      }
    } catch {
      setError(`Failed to ${action} invoice`);
    } finally {
      setActionLoading('');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadInvoicePdf(id);
    } catch {
      setError('Failed to download PDF');
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
              <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
              <span className={statusBadge(invoice.status)}>{invoice.status}</span>
            </div>
            <p className="text-foreground/60 text-sm">
              Created {new Date(invoice.createdAt).toLocaleDateString()}
              {invoice.dueDate && <> · Due {new Date(invoice.dueDate).toLocaleDateString()}</>}
            </p>
          </div>

          <div className="flex gap-2">
            {invoice.status === 'draft' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowConfirm('send')}
                disabled={actionLoading === 'send'}
              >
                <Send className="w-4 h-4" /> {actionLoading === 'send' ? 'Sending...' : 'Send'}
              </button>
            )}
            {(invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue') && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowConfirm('void')}
                disabled={actionLoading === 'void'}
              >
                <Ban className="w-4 h-4" /> Void
              </button>
            )}
            <button className="btn btn-outline btn-sm" onClick={handleDownloadPdf}>
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="form-label">Client</p>
            <p className="font-medium">{typeof invoice.clientId === 'string' ? invoice.clientId : invoice.clientId?.name}</p>
          </div>
          <div>
            <p className="form-label">Payment</p>
            {invoice.status === 'paid' ? (
              <div>
                <p className="font-medium text-success">Paid</p>
                <p className="text-sm text-foreground/60">
                  {invoice.paidAt && new Date(invoice.paidAt).toLocaleDateString()}
                  {invoice.paymentMethod && <> via {invoice.paymentMethod}</>}
                </p>
                {invoice.transactionRef && (
                  <p className="text-xs font-mono text-foreground/40">Ref: {invoice.transactionRef}</p>
                )}
              </div>
            ) : (
              <p className="font-medium text-foreground/60">{invoice.status === 'overdue' ? 'Overdue' : 'Unpaid'}</p>
            )}
          </div>
        </div>

        {invoice.notes && (
          <div className="mb-6 p-3 rounded-lg bg-surface border border-border">
            <p className="form-label">Notes</p>
            <p className="text-sm">{invoice.notes}</p>
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

        <div className="flex flex-col items-end mt-4 space-y-1 text-sm">
          <div className="flex justify-between w-64">
            <span className="text-foreground/60">Subtotal</span>
            <span className="font-mono">{invoice.currency || 'USD'} {subtotal.toFixed(2)}</span>
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
          <div className="flex justify-between w-64 border-t border-border pt-2 text-lg font-bold">
            <span>Total</span>
            <span className="font-mono">{invoice.currency || 'USD'} {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {showConfirm === 'send' && (
        <ConfirmDialog
          title="Send Invoice"
          message="Send this invoice to the client?"
          loading={actionLoading === 'send'}
          onConfirm={() => handleAction('send', () => sendInvoice(id))}
          onCancel={() => setShowConfirm(null)}
        />
      )}
      {showConfirm === 'void' && (
        <ConfirmDialog
          title="Void Invoice"
          message="Are you sure you want to void this invoice?"
          loading={actionLoading === 'void'}
          onConfirm={() => handleAction('void', () => voidInvoice(id))}
          onCancel={() => setShowConfirm(null)}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  title, message, loading, onConfirm, onCancel,
}: {
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
