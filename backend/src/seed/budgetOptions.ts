import BudgetOption from '../modules/budget-options/model';

const DEFAULT_OPTIONS = [
  { label: '< $10K', value: '< $10K', isActive: true, order: 0 },
  { label: '$10K – $25K', value: '$10K – $25K', isActive: true, order: 1 },
  { label: '$25K – $50K', value: '$25K – $50K', isActive: true, order: 2 },
  { label: '$50K+', value: '$50K+', isActive: true, order: 3 },
];

export async function seedBudgetOptions() {
  const count = await BudgetOption.countDocuments();
  if (count > 0) {
    console.log('  Budget options already seeded, skipping.');
    return;
  }
  for (const option of DEFAULT_OPTIONS) {
    await BudgetOption.create(option);
  }
  console.log(`  Seeded ${DEFAULT_OPTIONS.length} budget options.`);
}
