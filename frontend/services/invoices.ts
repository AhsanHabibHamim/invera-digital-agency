import { api, API_BASE } from '@/lib/api';
import { cookies } from '@/lib/cookies';
import type { Invoice } from '@/types';

export interface PaginatedInvoices {
  invoices: Invoice[];
  total: number;
  page: number;
  totalPages: number;
}

export function getInvoices(params?: Record<string, string>) {
  return api.get<PaginatedInvoices>('/invoices', params);
}

export function getInvoice(id: string) {
  return api.get<Invoice>(`/invoices/${id}`);
}

export function createInvoice(data: Partial<Invoice>) {
  return api.post<Invoice>('/invoices', data);
}

export function updateInvoice(id: string, data: Partial<Invoice>) {
  return api.patch<Invoice>(`/invoices/${id}`, data);
}

export function sendInvoice(id: string) {
  return api.patch<Invoice>(`/invoices/${id}/send`);
}

export function voidInvoice(id: string) {
  return api.patch<Invoice>(`/invoices/${id}/void`);
}

// ─── Manual payment submissions (Stripe removed) ─────────────────────────────
export interface PaymentSubmission {
  _id: string;
  invoiceId: string | { _id: string; invoiceNumber?: string; total?: number; currency?: string; status?: string };
  clientId: string | { _id: string; name?: string; email?: string; company?: string };
  method: 'bank_transfer' | 'bkash' | 'nagad' | 'other';
  transactionRef: string;
  amount?: number;
  screenshotUrl?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  reviewNote?: string;
  rejectionReason?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
}

export function submitPayment(
  invoiceId: string,
  data: { method: string; transactionRef: string; amount?: number; notes?: string },
  screenshot?: File | null,
) {
  const form = new FormData();
  form.set('method', data.method);
  form.set('transactionRef', data.transactionRef);
  if (data.amount !== undefined && data.amount !== null) form.set('amount', String(data.amount));
  if (data.notes) form.set('notes', data.notes);
  if (screenshot) form.set('screenshot', screenshot);
  return api.post<PaymentSubmission>(`/payments/invoice/${invoiceId}`, form);
}

export function getMyPaymentSubmissions() {
  return api.get<PaymentSubmission[]>('/payments/mine');
}

export function listPayments(params?: Record<string, string>) {
  return api.get<{ submissions: PaymentSubmission[]; total: number; page: number; totalPages: number }>(
    '/payments',
    params,
  );
}

export function confirmPayment(id: string) {
  return api.patch<PaymentSubmission>(`/payments/${id}/confirm`);
}

export function rejectPayment(id: string, reason: string) {
  return api.patch<PaymentSubmission>(`/payments/${id}/reject`, { reason });
}

// ─── Public payment instructions (bank accounts / bKash / Nagad) ──────────────
export interface PublicPaymentConfig {
  bankAccounts: Array<{ bankName: string; accountName: string; accountNumber: string; branch?: string; routing?: string; iban?: string; swift?: string }>;
  bkashNumber?: string;
  bkashType?: string;
  nagadNumber?: string;
  instructions?: string;
}

export function getPublicPaymentInfo() {
  return api.get<PublicPaymentConfig>('/settings/payments/public');
}

export async function downloadInvoicePdf(id: string) {
  const token = cookies.get('accessToken') || api.getAccessToken() || '';
  const res = await fetch(`${API_BASE}/invoices/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download invoice PDF');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
