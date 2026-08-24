/**
 * Creates (or promotes) the first admin account.
 *
 * Usage:
 *   ADMIN_EMAIL=you@domain.com ADMIN_PASSWORD='StrongPass123' npm run create-admin
 *
 * - If the email does not exist, a new verified admin is created.
 * - If it exists, the account is promoted to `super_admin` and verified.
 * - Refuses weak passwords (< 8 chars) to avoid shipping an easy target.
 */
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import User from '../modules/users/model';
import Role from '../modules/roles/model';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator';

  if (!email || !password) {
    console.error('Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run create-admin');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  await connectDB();

  // Attach every admin-capable system role.
  const roles = await Role.find({ slug: { $in: ['super_admin', 'admin'] } });
  const roleIds = roles.map((r) => r._id);
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.set({
      role: 'super_admin',
      roles: roleIds,
      isEmailVerified: true,
      passwordHash,
    } as never);
    await existing.save();
    console.log(`Promoted existing user ${email} to super_admin (password reset).`);
  } else {
    await User.create({
      name,
      email,
      passwordHash,
      role: 'super_admin',
      roles: roleIds,
      isEmailVerified: true,
    });
    console.log(`Created super_admin ${email}`);
  }

  await (await import('mongoose')).default.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
