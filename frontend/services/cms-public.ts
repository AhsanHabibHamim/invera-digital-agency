import { cache } from 'react';
import { API_BASE } from '@/lib/api';
import type { CmsContent } from '@/types';
import type { FooterContent, HomeContent, NavContent, ContactContent, PageSeo, PageBanner } from '@/types/cms';
import type { IBudgetOption, IPricingPlan } from '@/types/pricing';

const CMS_CACHE = { next: { revalidate: 300 } } as const;

// cache() dedupes identical calls within a single server render pass,
// so getPageBanner + getPageSeo on the same page hit the backend once.
export const getPublicPageContent = cache(
  async (pageKey: string): Promise<Record<string, unknown>> => {
    try {
      const res = await fetch(`${API_BASE}/cms/${pageKey}`, CMS_CACHE);
      if (!res.ok) return {};
      const json = (await res.json()) as { success: boolean; data?: CmsContent[] };
      if (!json.success || !Array.isArray(json.data)) return {};

      const map: Record<string, unknown> = {};
      for (const row of json.data) {
        if (typeof row.content === 'object' && row.content !== null) {
          map[row.sectionKey] = row.content;
        }
      }
      return map;
    } catch {
      return {};
    }
  },
);

export async function getHomeContent(): Promise<HomeContent> {
  const content = await getPublicPageContent('home');
  return content as HomeContent;
}

export async function getFooterContent(): Promise<FooterContent> {
  const content = await getPublicPageContent('footer');
  return content as FooterContent;
}

export async function getNavContent(): Promise<NavContent> {
  const content = await getPublicPageContent('nav');
  return content as NavContent;
}

export async function getContactContent(): Promise<ContactContent> {
  const content = await getPublicPageContent('contact');
  return content as ContactContent;
}

export async function getPageContent(pageKey: string): Promise<Record<string, unknown>> {
  return getPublicPageContent(pageKey);
}

export async function getPageBanner(pageKey: string): Promise<PageBanner> {
  const content = await getPublicPageContent(pageKey);
  return (content.page ?? {}) as PageBanner;
}

export async function getPageSeo(pageKey: string): Promise<PageSeo> {
  const content = await getPublicPageContent(pageKey);
  return (content.seo ?? {}) as PageSeo;
}

export async function getPublicPricingPlans(): Promise<IPricingPlan[]> {
  try {
    const res = await fetch(`${API_BASE}/pricing`, CMS_CACHE);
    if (!res.ok) return [];
    const json = (await res.json()) as { success: boolean; data?: IPricingPlan[] };
    if (!json.success || !Array.isArray(json.data)) return [];
    return json.data;
  } catch {
    return [];
  }
}

export async function getPublicBudgetOptions(): Promise<IBudgetOption[]> {
  try {
    const res = await fetch(`${API_BASE}/budget-options`, CMS_CACHE);
    if (!res.ok) return [];
    const json = (await res.json()) as { success: boolean; data?: IBudgetOption[] };
    if (!json.success || !Array.isArray(json.data)) return [];
    return json.data;
  } catch {
    return [];
  }
}
