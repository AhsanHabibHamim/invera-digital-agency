import PricingPlan from '../modules/pricing/model';

const DEFAULT_PLANS = [
  {
    name: 'Starter',
    description: 'Design and engineering sprints for early-stage products.',
    monthly: 4800,
    yearly: 3840,
    currency: 'USD',
    features: ['2 designers + 1 engineer', 'Weekly sprint reviews', 'Figma design system', '1 active project track', 'Async support'],
    badge: '',
    cta: 'Get started',
    ctaText: 'No setup fees. Pause anytime.',
    highlight: false,
    isActive: true,
    order: 0,
  },
  {
    name: 'Studio',
    description: 'Full-stack agency partnership for scaling products.',
    monthly: 11500,
    yearly: 9200,
    currency: 'USD',
    features: ['3 designers + 3 engineers', 'Dedicated project lead', 'Full design system + code', '3 active project tracks', 'Priority Slack channel', 'Monthly exec readout'],
    badge: 'Most popular',
    cta: 'Start a project',
    ctaText: 'Most teams pick this plan.',
    highlight: true,
    isActive: true,
    order: 1,
  },
  {
    name: 'Enterprise',
    description: 'Custom embedding for large organizations and long-term mandates.',
    monthly: 0,
    yearly: 0,
    currency: 'USD',
    features: ['Custom team composition', 'On-site availability', 'SLA-backed delivery', 'Unlimited tracks', 'Dedicated account partner', 'White-label option'],
    badge: '',
    cta: 'Contact us',
    ctaText: 'Custom scoping and procurement friendly.',
    highlight: false,
    isActive: true,
    order: 2,
  },
];

export async function seedPricingPlans() {
  const count = await PricingPlan.countDocuments();
  if (count > 0) {
    console.log('  Pricing plans already seeded, skipping.');
    return;
  }
  for (const plan of DEFAULT_PLANS) {
    await PricingPlan.create(plan);
  }
  console.log(`  Seeded ${DEFAULT_PLANS.length} pricing plans.`);
}
