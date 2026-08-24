import { connectDB } from '../config/db';
import { repairCmsDefaults, seedCmsDefaults } from './cmsDefaults';
import { seedPricingPlans } from './pricingPlans';
import { seedBudgetOptions } from './budgetOptions';
import { seedRoles, seedPermissions, seedRolePermissions } from './defaultRoles';

/**
 * Heals an existing database that has drifted from the expected schema:
 * creates missing sections, backfills missing fields, normalizes corrupt
 * title shapes, and re-seeds pricing/budget/roles defaults.
 *
 * Safe to run repeatedly. Never overwrites existing user-edited values.
 */
async function main() {
  console.log('Connecting to database...');
  await connectDB();
  await seedCmsDefaults();
  await repairCmsDefaults();
  await seedPricingPlans();
  await seedBudgetOptions();
  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
  console.log('Repair complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Repair failed:', err);
  process.exit(1);
});
