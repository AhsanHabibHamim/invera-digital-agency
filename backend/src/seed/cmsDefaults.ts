import CmsContent from '../modules/cms/model';

interface CmsDefault {
  pageKey: string;
  sectionKey: string;
  contentType: 'text' | 'html' | 'json' | 'image';
  content: unknown;
}

// --- Shared helpers -------------------------------------------------------

function titleSegments(parts: { text: string; tone?: 'primary' | 'accent'; break?: boolean }[]) {
  return parts.map((p) => ({ text: p.text, tone: p.tone || '', break: !!p.break }));
}

function seo(metaTitle: string, metaDescription: string, ogImage?: string) {
  return { metaTitle, metaDescription, ogImage: ogImage || '' };
}

function banner(eyebrow: string, parts: { text: string; tone?: 'primary' | 'accent'; break?: boolean }[], description: string) {
  return { eyebrow, title: titleSegments(parts), description };
}

// --- Home page ------------------------------------------------------------

const HOME_DEFAULTS: CmsDefault[] = [
  {
    pageKey: 'home',
    sectionKey: 'hero',
    contentType: 'json',
    content: {
      eyebrow: 'Digital Agency',
      title: titleSegments([
        { text: 'We build ' },
        { text: 'systems', tone: 'primary' },
        { text: 'that ', break: true },
        { text: 'scale.', tone: 'accent' },
      ]),
      subheadline:
        'We design and engineer SaaS products, internal tools, and growth platforms for teams that refuse to ship average.',
      primaryButton: { label: 'Start a project', href: '/contact', action: 'start' },
      secondaryButton: { label: 'View our work', href: '/work', action: 'navigate' },
      stats: [
        { value: 140, suffix: '+', label: 'Projects shipped' },
        { value: 98, suffix: '%', label: 'Client satisfaction' },
        { value: 12, suffix: 'M+', label: 'Users reached' },
      ],
    },
  },
  {
    pageKey: 'home',
    sectionKey: 'logos',
    contentType: 'json',
    content: {
      label: 'Trusted by teams at',
      logos: ['Vercel', 'Stripe', 'Linear', 'Notion', 'Figma', 'Loom', 'Retool', 'Supabase', 'Planetscale', 'Railway'],
    },
  },
  {
    pageKey: 'home',
    sectionKey: 'services',
    contentType: 'json',
    content: {
      eyebrow: '( 02 ) — Services',
      title: titleSegments([
        { text: 'Every discipline, ' },
        { text: 'one team.', tone: 'primary' },
      ]),
      services: [
        {
          number: '01',
          title: 'Product Design',
          desc: 'Full-stack design systems, interaction models, and high-fidelity prototypes that communicate intent — not just aesthetics.',
          tags: ['UX Research', 'Design Systems', 'Prototyping'],
        },
        {
          number: '02',
          title: 'Engineering',
          desc: 'From API architecture to pixel-perfect frontends. We ship production-grade code that scales with your ambitions.',
          tags: ['React', 'Node.js', 'Infra'],
        },
        {
          number: '03',
          title: 'Growth Systems',
          desc: 'Conversion-optimized flows, analytics pipelines, and experiment frameworks to turn growth into a repeatable function.',
          tags: ['Analytics', 'A/B Testing', 'Funnels'],
        },
        {
          number: '04',
          title: 'AI Integration',
          desc: 'LLM-powered features, RAG pipelines, and agentic workflows integrated cleanly into your existing product surface.',
          tags: ['LLMs', 'Agents', 'RAG'],
        },
      ],
    },
  },
  {
    pageKey: 'home',
    sectionKey: 'whyChooseUs',
    contentType: 'json',
    content: {
      eyebrow: '( 03 ) — Why Us',
      title: titleSegments([
        { text: 'Built for ' },
        { text: 'outcomes,', tone: 'accent' },
        { text: 'not outputs.', break: true },
      ]),
      paragraph:
        'Most agencies deliver artifacts. We deliver working systems. Every engagement ends with your team in full control of something they can grow.',
      processSteps: [
        {
          num: '01',
          title: 'Deep discovery',
          desc: "We don't start designing until we understand your users, your business model, and where you want to be in 24 months.",
        },
        {
          num: '02',
          title: 'Rapid iteration',
          desc: 'Weekly sprint cycles with live Figma reviews, staging deployments, and async feedback loops that eliminate bottlenecks.',
        },
        {
          num: '03',
          title: 'Systems thinking',
          desc: 'Every component, every API endpoint, every pipeline is built to be extended — not rewritten when requirements shift.',
        },
        {
          num: '04',
          title: 'Embedded ownership',
          desc: 'Your team inherits every asset, every decision document, and a handoff that actually makes sense to the engineers who follow us.',
        },
      ],
    },
  },
  {
    pageKey: 'home',
    sectionKey: 'portfolio',
    contentType: 'json',
    content: {
      eyebrow: '( 04 ) — Selected Work',
      title: titleSegments([
        { text: 'Work that ' },
        { text: 'speaks.', tone: 'primary' },
      ]),
      categories: ['All', 'SaaS', 'Dashboard', 'Mobile', 'AI'],
      projects: [
        {
          title: 'Meridian Analytics',
          category: 'Dashboard',
          desc: 'Real-time data platform for Series B fintech.',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&auto=format',
          color: '#6f4df1',
        },
        {
          title: 'Orbit CRM',
          category: 'SaaS',
          desc: 'B2B sales intelligence and pipeline management.',
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop&auto=format',
          color: '#c7f36b',
        },
        {
          title: 'Pulse Health',
          category: 'Mobile',
          desc: 'Patient monitoring app used by 3 hospital networks.',
          image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=500&fit=crop&auto=format',
          color: '#6f4df1',
        },
        {
          title: 'Cortex AI',
          category: 'AI',
          desc: 'Agentic document intelligence platform.',
          image: 'https://images.unsplash.com/photo-1677442135968-6db3b0025e95?w=800&h=500&fit=crop&auto=format',
          color: '#c7f36b',
        },
        {
          title: 'Flux Payments',
          category: 'SaaS',
          desc: 'Global payout infrastructure for creator platforms.',
          image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=500&fit=crop&auto=format',
          color: '#6f4df1',
        },
        {
          title: 'Beacon Dashboard',
          category: 'Dashboard',
          desc: 'Operational command center for logistics SaaS.',
          image: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=500&fit=crop&auto=format',
          color: '#c7f36b',
        },
      ],
    },
  },
  {
    pageKey: 'home',
    sectionKey: 'testimonials',
    contentType: 'json',
    content: {
      eyebrow: '( 05 ) — Testimonials',
      title: titleSegments([
        { text: 'Words from ' },
        { text: 'builders.', tone: 'accent' },
      ]),
      testimonials: [
        {
          quote:
            "Systemic didn't just build our dashboard — they redesigned how our team thinks about data. The velocity post-launch was unlike any agency engagement I've seen.",
          author: 'Elena Vasquez',
          role: 'Head of Product, Meridian Analytics',
          avatar: 'EV',
          stars: 5,
        },
        {
          quote:
            'We tried two other agencies before Systemic. The difference is that they actually understand engineering constraints. The handoff was clean, documented, and our team was up to speed in a week.',
          author: 'Marcus Chen',
          role: 'CTO, Orbit CRM',
          avatar: 'MC',
          stars: 5,
        },
        {
          quote:
            "The AI pipeline they built for Cortex processes 40K documents a day with 94% accuracy. That's not a design agency result — that's a product engineering result.",
          author: 'Priya Nair',
          role: 'CEO, Cortex AI',
          avatar: 'PN',
          stars: 5,
        },
        {
          quote:
            "Three months, from zero to production. The system they shipped handles $8M monthly volume without a hiccup. I'd work with them again tomorrow.",
          author: 'James Okafor',
          role: 'Founder, Flux Payments',
          avatar: 'JO',
          stars: 5,
        },
      ],
    },
  },
  {
    pageKey: 'home',
    sectionKey: 'faq',
    contentType: 'json',
    content: {
      eyebrow: '( 07 ) — FAQ',
      title: titleSegments([{ text: 'Common questions.' }]),
      description: 'Still have something specific? We reply within 4 hours on business days.',
      items: [
        {
          q: 'How does your engagement model work?',
          a: "We work in monthly retainers with weekly sprint cycles. You'll have a dedicated Slack channel, weekly video reviews, and a shared Linear board so you always know what's in progress.",
        },
        {
          q: 'Do you work with early-stage startups?',
          a: 'Yes — our Starter plan is designed specifically for seed and Series A teams who need to move fast without building an in-house design and engineering team.',
        },
        {
          q: 'What do you hand off at the end of an engagement?',
          a: 'Everything: a living Figma design system, clean GitHub repos with CI/CD configured, a written architectural decision record, and a 2-hour walkthrough session with whoever inherits the work.',
        },
        {
          q: 'Can we start with just design before adding engineering?',
          a: 'Absolutely. Many clients start with design-only sprints to validate product direction before committing to build cycles. We structure the design work so engineering can pick it up cleanly.',
        },
        {
          q: "What's the typical project timeline?",
          a: 'Most product design + MVP engineering engagements run 8–16 weeks. We scope each project in a discovery call and give you a fixed schedule with milestones before any work begins.',
        },
        {
          q: 'Do you offer post-launch support?',
          a: 'Yes. We offer a maintenance retainer for teams that want continued iteration, bug fixes, and feature additions after launch without spinning up a new engagement.',
        },
      ],
    },
  },
  {
    pageKey: 'home',
    sectionKey: 'finalCta',
    contentType: 'json',
    content: {
      eyebrow: '( 08 ) — Let\u2019s Build',
      title: titleSegments([
        { text: 'Ready to ship ' },
        { text: 'something', tone: 'accent' },
        { text: 'remarkable?', break: true, tone: 'primary' },
      ]),
      description:
        "We take on 3–4 new projects per quarter. Tell us what you're building and let's see if we're a fit.",
      primaryButton: { label: 'Start a project', href: '/contact', action: 'start' },
      secondaryButton: { label: 'Book a call', href: '/contact', action: 'navigate' },
    },
  },
  {
    pageKey: 'home',
    sectionKey: 'seo',
    contentType: 'json',
    content: seo(
      'Invera Digital Agency — Creative & Tech Studio',
      'We design and engineer SaaS products, internal tools, and growth platforms for teams that refuse to ship average.',
      ''
    ),
  },
];

// --- Footer ---------------------------------------------------------------

const FOOTER_DEFAULTS: CmsDefault[] = [
  {
    pageKey: 'footer',
    sectionKey: 'brand',
    contentType: 'json',
    content: {
      companyName: 'Invera Digital Agency',
      tagline: 'Design & engineering studio',
      description:
        'We design and engineer SaaS products, internal tools, and growth platforms for teams that refuse to ship average.',
      logo: '/logo.svg',
    },
  },
  {
    pageKey: 'footer',
    sectionKey: 'cta',
    contentType: 'json',
    content: {
      title: "Let's build something remarkable",
      subtitle: "Tell us about your project and we'll get back to you within 24 hours.",
      buttonText: 'Start a project',
      buttonAction: 'start',
    },
  },
  {
    pageKey: 'footer',
    sectionKey: 'newsletter',
    contentType: 'json',
    content: {
      title: 'Stay in the loop',
      description: 'Product insights, design teardowns, and engineering notes — once a month, no spam.',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe',
      successMessage: 'Thanks for subscribing!',
    },
  },
  {
    pageKey: 'footer',
    sectionKey: 'links',
    contentType: 'json',
    content: {
      columns: [
        {
          title: 'Quick Links',
          links: [
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: 'Portfolio', href: '/work' },
            { label: 'Process', href: '/process' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'FAQ', href: '/faq' },
          ],
        },
        {
          title: 'Services',
          links: [
            { label: 'Product Design', href: '/services' },
            { label: 'Engineering', href: '/services' },
            { label: 'Growth Systems', href: '/services' },
            { label: 'AI Integration', href: '/services' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'Testimonials', href: '/testimonials' },
            { label: 'Contact', href: '/contact' },
            { label: 'Blog', href: '/' },
            { label: 'Case Studies', href: '/work' },
          ],
        },
      ],
    },
  },
  {
    pageKey: 'footer',
    sectionKey: 'contact',
    contentType: 'json',
    content: {
      email: 'hello@inveradigitalagency.com',
      phone: '+1 (555) 000-0000',
      address: 'Remote, worldwide',
      hours: 'Mon–Fri, 9am–6pm',
    },
  },
  {
    pageKey: 'footer',
    sectionKey: 'social',
    contentType: 'json',
    content: {
      links: [
        { label: 'X', href: 'https://x.com' },
        { label: 'LinkedIn', href: 'https://linkedin.com' },
        { label: 'GitHub', href: 'https://github.com' },
        { label: 'Dribbble', href: 'https://dribbble.com' },
      ],
    },
  },
  {
    pageKey: 'footer',
    sectionKey: 'stats',
    contentType: 'json',
    content: {
      items: [
        { value: 140, suffix: '+', label: 'Projects shipped' },
        { value: 98, suffix: '%', label: 'Client satisfaction' },
        { value: 12, suffix: 'M+', label: 'Users reached' },
        { value: 24, suffix: '/7', label: 'Support' },
      ],
    },
  },
  {
    pageKey: 'footer',
    sectionKey: 'badges',
    contentType: 'json',
    content: {
      items: [
        { label: 'Top Rated Agency', icon: 'Award' },
        { label: 'ISO 27001 Compliant', icon: 'ShieldCheck' },
        { label: 'Certified Partners', icon: 'BadgeCheck' },
      ],
    },
  },
  {
    pageKey: 'footer',
    sectionKey: 'legal',
    contentType: 'json',
    content: {
      copyright: '© 2026 Invera Digital Agency. All rights reserved.',
      privacyLabel: 'Privacy Policy',
      privacyHref: '/privacy',
      termsLabel: 'Terms of Service',
      termsHref: '/terms',
      cookiesLabel: 'Cookie Policy',
      cookiesHref: '/cookies',
    },
  },
  {
    pageKey: 'footer',
    sectionKey: 'seo',
    contentType: 'json',
    content: seo('Invera Digital Agency — Footer', 'Footer content for Invera Digital Agency.', ''),
  },
];

// --- Navigation -----------------------------------------------------------

const NAV_DEFAULTS: CmsDefault[] = [
  {
    pageKey: 'nav',
    sectionKey: 'main',
    contentType: 'json',
    content: {
      items: [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
        { label: 'Process', href: '/process' },
        { label: 'Portfolio', href: '/work' },
        { label: 'Testimonials', href: '/testimonials' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Contact', href: '/contact' },
      ],
      cta: { label: 'Start a project', action: 'start' },
    },
  },
  {
    pageKey: 'nav',
    sectionKey: 'seo',
    contentType: 'json',
    content: seo('Invera Digital Agency — Navigation', 'Primary navigation for Invera Digital Agency.', ''),
  },
];

// --- Public page banners + SEO --------------------------------------------

const PAGE_BANNERS: Record<string, { eyebrow: string; parts: { text: string; tone?: 'primary' | 'accent'; break?: boolean }[]; description: string; metaTitle: string; metaDescription: string }> = {
  services: {
    eyebrow: '( 02 ) — Services',
    parts: [{ text: 'Every discipline, ' }, { text: 'one team.', tone: 'primary' }],
    description:
      'From product design and engineering to growth systems and AI integration — one team that ships the whole system, end to end.',
    metaTitle: 'Services — Invera Digital Agency',
    metaDescription:
      'Product design, engineering, growth systems, and AI integration — one team that ships the whole system, end to end.',
  },
  process: {
    eyebrow: '( 03 ) — Process',
    parts: [
      { text: 'Built for ' },
      { text: 'outcomes,', tone: 'accent' },
      { text: 'not outputs.', break: true },
    ],
    description:
      'A proven engagement model: deep discovery, rapid iteration, systems thinking, and full ownership handed back to your team.',
    metaTitle: 'Process — Invera Digital Agency',
    metaDescription:
      'A proven engagement model: deep discovery, rapid iteration, systems thinking, and full ownership handed back to your team.',
  },
  work: {
    eyebrow: '( 04 ) — Selected Work',
    parts: [{ text: 'Work that ' }, { text: 'speaks.', tone: 'primary' }],
    description:
      "A selection of products we've designed, engineered, and shipped with teams that refuse to ship average.",
    metaTitle: 'Selected Work — Invera Digital Agency',
    metaDescription:
      "A selection of products we've designed, engineered, and shipped with teams that refuse to ship average.",
  },
  testimonials: {
    eyebrow: '( 05 ) — Testimonials',
    parts: [{ text: 'Words from ' }, { text: 'builders.', tone: 'accent' }],
    description:
      "Founders, product leaders, and engineers on what it's like to work with us — and the systems they got out of it.",
    metaTitle: 'Testimonials — Invera Digital Agency',
    metaDescription:
      "Founders, product leaders, and engineers on what it's like to work with us — and the systems they got out of it.",
  },
  pricing: {
    eyebrow: '( 06 ) — Pricing',
    parts: [{ text: 'Transparent ' }, { text: 'pricing.', tone: 'primary' }],
    description:
      'Monthly retainers with weekly sprint cycles. Pick a plan that fits your stage — or talk to us about a custom engagement.',
    metaTitle: 'Pricing — Invera Digital Agency',
    metaDescription:
      'Monthly retainers with weekly sprint cycles. Pick a plan that fits your stage — or talk to us about a custom engagement.',
  },
  faq: {
    eyebrow: '( 07 ) — FAQ',
    parts: [{ text: 'Common questions.' }],
    description: 'Still have something specific? We reply within 4 hours on business days.',
    metaTitle: 'FAQ — Invera Digital Agency',
    metaDescription: 'Frequently asked questions about how we work, what we deliver, and timelines.',
  },
  contact: {
    eyebrow: '( 08 ) — Contact',
    parts: [{ text: "Let's build " }, { text: 'something great.', tone: 'primary' }],
    description:
      "Tell us about your project and let's see if we're a fit. We take on 3–4 new engagements per quarter.",
    metaTitle: 'Contact — Invera Digital Agency',
    metaDescription:
      "Get in touch. Tell us about your project and let's see if we're a fit. We reply within 4 business hours.",
  },
};

function buildPageDefaults(pageKey: string): CmsDefault[] {
  const page = PAGE_BANNERS[pageKey];
  if (!page) return [];
  return [
    {
      pageKey,
      sectionKey: 'page',
      contentType: 'json',
      content: banner(page.eyebrow, page.parts, page.description),
    },
    {
      pageKey,
      sectionKey: 'seo',
      contentType: 'json',
      content: seo(page.metaTitle, page.metaDescription, ''),
    },
  ];
}

// --- Contact page ---------------------------------------------------------

const CONTACT_DEFAULTS: CmsDefault[] = [
  {
    pageKey: 'contact',
    sectionKey: 'contactInfo',
    contentType: 'json',
    content: {
      info: [
        {
          icon: 'mail',
          label: 'Email',
          value: 'hello@inveradigitalagency.com',
          href: 'mailto:hello@inveradigitalagency.com',
        },
        { icon: 'map-pin', label: 'Location', value: 'Remote, worldwide', href: '' },
        { icon: 'clock', label: 'Response time', value: 'Within 4 hours, business days', href: '' },
        { icon: 'phone', label: 'Phone', value: '+1 (555) 000-0000', href: 'tel:+15550000000' },
      ],
      preferAsyncText:
        'Prefer async? Start a project and we\u2019ll scope it with you on a short intro call.',
    },
  },
  {
    pageKey: 'contact',
    sectionKey: 'form',
    contentType: 'json',
    content: {
      title: 'Tell us about your project',
      successMessage:
        'Thanks for reaching out! We\u2019ll get back to you within 4 business hours.',
      noteText: 'No spam. We only reach out about your inquiry.',
      budgetLabel: 'Budget range',
      budgetPlaceholder: 'Select a range',
      submitLabel: 'Send message',
      sendingLabel: 'Sending...',
      fields: [
        { name: 'name', label: 'Full name *', placeholder: 'Jane Doe', type: 'text', required: true },
        { name: 'email', label: 'Email *', placeholder: 'jane@company.com', type: 'email', required: true },
        { name: 'company', label: 'Company', placeholder: 'Company Inc.', type: 'text', required: false },
        { name: 'budget', label: 'Budget range', placeholder: 'Select a range', type: 'select', required: false },
        {
          name: 'message',
          label: 'Project details *',
          placeholder: 'What are you building? Timeline, goals, and anything else we should know.',
          type: 'textarea',
          required: true,
        },
      ],
    },
  },
];

// --- Seeder ---------------------------------------------------------------

const ALL_DEFAULTS: CmsDefault[] = [
  ...HOME_DEFAULTS,
  ...FOOTER_DEFAULTS,
  ...NAV_DEFAULTS,
  ...Object.keys(PAGE_BANNERS).flatMap((key) => buildPageDefaults(key)),
  ...CONTACT_DEFAULTS,
];

/**
 * Normalizes a CMS title field that was saved as a plain string (e.g. through
 * the generic CMS editor) into the segment array shape consumed by the
 * frontend `Title` component. Existing segment arrays are left untouched.
 */
function normalizeTitleField(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim() ? [{ text: value, tone: '', break: false }] : [];
  }
  return value;
}

/**
 * Heals CMS content so it always matches the shape the public site expects:
 * - Missing sections are created from defaults.
 * - Existing sections get any missing top-level keys backfilled from defaults
 *   (user-edited values are never overwritten).
 * - `title` fields are normalized to the shape the default defines: sections
 *   whose default title is a segment array get string titles converted to
 *   segments, and sections whose default title is a plain string get any
 *   segment-array title flattened back to a string.
 */
export async function repairCmsDefaults() {
  let created = 0;
  let repaired = 0;

  for (const item of ALL_DEFAULTS) {
    const existing = await CmsContent.findOne({
      pageKey: item.pageKey,
      sectionKey: item.sectionKey,
    });

    if (!existing) {
      await CmsContent.create(item);
      created++;
      continue;
    }

    if (existing.contentType !== 'json') continue;

    const current = existing.content;
    const fallback = item.content;
    if (typeof current !== 'object' || current === null) continue;
    if (typeof fallback !== 'object' || fallback === null) continue;

    const merged: Record<string, unknown> = {};
    let changed = false;

    for (const [key, fallbackValue] of Object.entries(fallback as Record<string, unknown>)) {
      const currentValue = (current as Record<string, unknown>)[key];

      if (key === 'title' && currentValue !== undefined) {
        let normalized: unknown;
        if (Array.isArray(fallbackValue)) {
          normalized = normalizeTitleField(currentValue);
        } else {
          normalized = Array.isArray(currentValue)
            ? currentValue.map((s) => (s && typeof s.text === 'string' ? s.text : '')).join('')
            : currentValue;
        }
        if (JSON.stringify(normalized) !== JSON.stringify(currentValue)) {
          merged[key] = normalized;
          changed = true;
        } else {
          merged[key] = currentValue;
        }
      } else if (currentValue === undefined) {
        merged[key] = fallbackValue;
        changed = true;
      } else {
        merged[key] = currentValue;
      }
    }

    if (changed) {
      existing.set('content', merged);
      await existing.save();
      repaired++;
    }
  }

  if (created) console.log(`  CMS repair: created ${created} missing sections.`);
  if (repaired) console.log(`  CMS repair: normalized ${repaired} existing sections.`);
  if (!created && !repaired) console.log('  CMS repair: no changes needed.');
}

export async function seedCmsDefaults() {
  for (const item of ALL_DEFAULTS) {
    await CmsContent.updateOne(
      { pageKey: item.pageKey, sectionKey: item.sectionKey },
      { $setOnInsert: { ...item } },
      { upsert: true }
    );
  }
  console.log(`  Seeded ${ALL_DEFAULTS.length} CMS sections across pages.`);
}
