import { api } from '@/lib/api';
import type { Invoice, Quote } from '@/types';

export interface PaginatedQuotes {
  quotes: Quote[];
  total: number;
  page: number;
  totalPages: number;
}

export function getQuotes(params?: Record<string, string>) {
  return api.get<PaginatedQuotes>('/quotes', params);
}

export function getQuote(id: string) {
  return api.get<Quote>(`/quotes/${id}`);
}

export function createQuote(data: Partial<Quote>) {
  return api.post<Quote>('/quotes', data);
}

export function updateQuote(id: string, data: Partial<Quote>) {
  return api.patch<Quote>(`/quotes/${id}`, data);
}

export function deleteQuote(id: string) {
  return api.delete<null>(`/quotes/${id}`);
}

export function sendQuote(id: string) {
  return api.patch<Quote>(`/quotes/${id}/send`);
}

export function convertQuoteToInvoice(id: string) {
  return api.post<{ quote: Quote; invoice: Invoice }>(`/quotes/${id}/convert-to-invoice`);
}
