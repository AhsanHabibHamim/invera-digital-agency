import { api } from '@/lib/api';
import type { Review } from '@/types';

export function getPublicReviews() {
  return api.get<Review[]>('/reviews/public');
}

export function getAdminReviews(params?: Record<string, string>) {
  return api.get<Review[]>('/reviews', params);
}

export function createReview(data: { rating: number; comment: string; projectId: string }) {
  return api.post<Review>('/reviews', data);
}

export function approveReview(id: string) {
  return api.patch<Review>(`/reviews/${id}/approve`);
}
