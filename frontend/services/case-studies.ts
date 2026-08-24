import { api } from '@/lib/api';
import type { CaseStudy } from '@/types';

export function getPublicCaseStudies() {
  return api.get<CaseStudy[]>('/case-studies/public');
}

export function getPublicCaseStudy(slug: string) {
  return api.get<CaseStudy>(`/case-studies/public/${slug}`);
}

export function getCaseStudies(params?: Record<string, string>) {
  return api.get<CaseStudy[]>('/case-studies', params);
}

export function getCaseStudy(id: string) {
  return api.get<CaseStudy>(`/case-studies/${id}`);
}

export function createCaseStudy(data: Partial<CaseStudy>) {
  return api.post<CaseStudy>('/case-studies', data);
}

export function updateCaseStudy(id: string, data: Partial<CaseStudy>) {
  return api.patch<CaseStudy>(`/case-studies/${id}`, data);
}

export function deleteCaseStudy(id: string) {
  return api.delete<null>(`/case-studies/${id}`);
}
