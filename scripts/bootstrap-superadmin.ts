/**
 * Creates the first Super Admin and prints a ONE-TIME setup link (valid for 72 hours).
 * The link is shown only in this terminal. The account has no password until the link is used.
 *
 *   BOOTSTRAP_EMAIL=owner@example.com BOOTSTRAP_NAME="Full Name" npm run bootstrap:superadmin
 *
 * Refuses to run when an active Super Admin already exists.
 */
import { db } from '../src/lib/db';
import { generateToken, sha256 } from '../src/lib/security/crypto';
import { setupUrl } from '../src/lib/auth/accounts';

const SETUP_TTL_HOURS = 72;

async function main() {
  const email = (process.env.BOOTSTRAP_EMAIL ?? '').trim().toLowerCase();
  const name = (process.env.BOOTSTRAP_NAME ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set BOOTSTRAP_EMAIL to a valid email address.');
  if (name.length < 2 || name.length > 120) throw new Error('Set BOOTSTRAP_NAME to the administrator’s full name.');

  const activeSuper = await db.user.count({ where: { role: 'SUPER_ADMIN', status: 'ACTIVE', deletedAt: null } });
  if (activeSuper > 0) throw new Error('An active Super Admin already exists. Use the Administrators page to add more.');

  const token = generateToken();
  const user = await db.user.upsert({
    where: { email },
    create: { email, name, role: 'SUPER_ADMIN', status: 'ACTIVE' },
    update: { role: 'SUPER_ADMIN', status: 'ACTIVE', deletedAt: null },
    select: { id: true },
  });
  await db.accountToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      purpose: 'SETUP',
      expiresAt: new Date(Date.now() + SETUP_TTL_HOURS * 3600_000),
    },
  });
  console.log('\nSuper Admin created. Open this one-time link to set the password (valid 72 hours, single use):\n');
  console.log(setupUrl(token));
  console.log('\nThe link will not be shown again. Issue a new one from the Administrators page if it is lost.\n');
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
