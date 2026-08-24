import { api } from '@/lib/api';
import type { CmsContent, SeoMeta } from '@/types';

export function getPageSections(pageKey: string) {
  return api.get<CmsContent[]>(`/cms/${pageKey}`);
}

export function getSection(pageKey: string, sectionKey: string) {
  return api.get<CmsContent>(`/cms/${pageKey}/${sectionKey}`);
}

export type CmsContentPayload = string | Record<string, unknown> | unknown[] | number | boolean;

export function upsertSection(pageKey: string, sectionKey: string, data: { contentType: string; content: CmsContentPayload }) {
  return api.put<CmsContent>(`/cms/${pageKey}`, { sectionKey, ...data });
}

export function updateSeo(pageKey: string, data: SeoMeta) {
  return api.patch<CmsContent>(`/cms/${pageKey}/seo`, data);
}

export function deleteSection(pageKey: string, sectionKey: string) {
  return api.delete<null>(`/cms/${pageKey}/${sectionKey}`);
}
