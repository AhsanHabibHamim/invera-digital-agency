/**
 * Schema registry for CMS sections rendered by the public site.
 *
 * The generic CMS editor lets admins paste arbitrary JSON, which can silently
 * corrupt the shape the frontend expects (e.g. a `title` saved as a plain
 * string instead of a segment array). This registry lets us validate and
 * normalize known sections on save so the public site never crashes.
 */

interface SectionSchema {
  /** Expected shape of the `title` field, if present. */
  title?: 'segments' | 'string';
  /** Keys that must be arrays (e.g. stats, services, projects). */
  arrayFields?: string[];
}

const SCHEMAS: Record<string, Record<string, SectionSchema>> = {
  home: {
    hero: { title: 'segments', arrayFields: ['stats'] },
    logos: { arrayFields: ['logos'] },
    services: { title: 'segments', arrayFields: ['services'] },
    whyChooseUs: { title: 'segments', arrayFields: ['processSteps'] },
    portfolio: { title: 'segments', arrayFields: ['categories', 'projects'] },
    testimonials: { title: 'segments', arrayFields: ['testimonials'] },
    pricing: { title: 'segments', arrayFields: ['plans'] },
    faq: { title: 'segments', arrayFields: ['items'] },
    finalCta: { title: 'segments' },
    seo: {},
  },
  footer: {
    cta: { title: 'string' },
    newsletter: { title: 'string' },
    links: { arrayFields: ['columns'] },
    social: { arrayFields: ['links'] },
    stats: { arrayFields: ['items'] },
    badges: { arrayFields: ['items'] },
  },
  nav: {},
  services: { page: { title: 'segments' } },
  process: { page: { title: 'segments' } },
  work: { page: { title: 'segments' } },
  testimonials: { page: { title: 'segments' } },
  pricing: { page: { title: 'segments' } },
  faq: { page: { title: 'segments' } },
  contact: {
    page: { title: 'segments' },
    form: { title: 'string', arrayFields: ['fields'] },
    contactInfo: { arrayFields: ['info'] },
  },
};

export function getSectionSchema(pageKey: string, sectionKey: string): SectionSchema | undefined {
  return SCHEMAS[pageKey]?.[sectionKey];
}

/**
 * Normalizes a CMS JSON payload to the shape the public site expects.
 * Only known sections are touched; unknown sections pass through unchanged.
 */
export function normalizeCmsContent(
  pageKey: string,
  sectionKey: string,
  content: unknown
): { content: unknown; changed: boolean } {
  if (typeof content !== 'object' || content === null || Array.isArray(content)) {
    return { content, changed: false };
  }
  const schema = getSectionSchema(pageKey, sectionKey);
  if (!schema) return { content, changed: false };

  const out: Record<string, unknown> = { ...(content as Record<string, unknown>) };
  let changed = false;

  if (schema.title && out.title !== undefined) {
    if (schema.title === 'segments' && typeof out.title === 'string') {
      out.title = out.title.trim() ? [{ text: out.title, tone: '', break: false }] : [];
      changed = true;
    } else if (schema.title === 'string' && Array.isArray(out.title)) {
      out.title = out.title
        .map((s) => (s && typeof (s as { text?: unknown }).text === 'string' ? (s as { text: string }).text : ''))
        .join('');
      changed = true;
    }
  }

  for (const field of schema.arrayFields ?? []) {
    if (out[field] !== undefined && !Array.isArray(out[field])) {
      out[field] = [];
      changed = true;
    }
  }

  return { content: out, changed };
}
