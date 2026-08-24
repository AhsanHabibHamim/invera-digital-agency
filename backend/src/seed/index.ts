import { connectDB } from '../config/db';
import { seedAll } from './defaultRoles';
import { seedCmsDefaults } from './cmsDefaults';
import { seedPricingPlans } from './pricingPlans';
import { seedBudgetOptions } from './budgetOptions';

async function main() {
  console.log('Connecting to database...');
  await connectDB();
  await seedAll();
  console.log('Seeding CMS defaults...');
  await seedCmsDefaults();
  console.log('Seeding pricing plans...');
  await seedPricingPlans();
  console.log('Seeding budget options...');
  await seedBudgetOptions();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
