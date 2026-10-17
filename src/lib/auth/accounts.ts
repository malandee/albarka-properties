import { db } from '@/lib/db';
import { errors, ApiError } from '@/lib/http';
import { recordAudit } from '@/lib/audit';
import { generateToken, hashPassword, sha256, verifyPassword } from '@/lib/security/crypto';
import { consumeRateLimit } from '@/lib/security/rate-limit';
import { getEnv } from '@/lib/env';
import { canDeactivateAdministrator, canRemoveAdministrator, isActiveSuperAdmin, PERMISSIONS, type Actor } from './policy';
import { createSession, revokeAllSessions } from './session';
import { passwordIssues } from '@/lib/validation/account';

const SETUP_TTL_HOURS = 72;
const RESET_TTL_HOURS = 24;

// Computed once per process so that unknown emails cost about the same time as real ones.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword('timing-equaliser-not-a-real-password-1');
  return dummyHashPromise;
}

export interface LoginResult {
  token: string;
  expiresAt: Date;
  user: { id: string; name: string; role: 'SUPER_ADMIN' | 'ADMIN' };
}

/** Authenticates by email and password. Returns a generic error for every failure mode. */
export async function login(input: { email: string; password: string; ip: string | null; userAgent: string | null }): Promise<LoginResult> {
  const ipKey = input.ip ?? 'unknown';
  const perIp = await consumeRateLimit(`login:ip:${ipKey}`, 60, 15 * 60);
  if (!perIp.allowed) throw errors.rateLimited(perIp.retryAfterSeconds);
  const perEmail = await consumeRateLimit(`login:email:${input.email}`, 10, 15 * 60);
  if (!perEmail.allowed) throw errors.rateLimited(perEmail.retryAfterSeconds);

  const invalid = () => new ApiError(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.');
  const user = await db.user.findUnique({ where: { email: input.email } });
  const hash = user?.passwordHash ?? (await getDummyHash());
  const passwordOk = await verifyPassword(hash, input.password);
  if (!user || !user.passwordHash || !passwordOk || user.deletedAt || user.status !== 'ACTIVE') {
    throw invalid();
  }

  const { token, expiresAt } = await createSession(user.id, input.userAgent);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastActivityAt: new Date() } });
  await recordAudit({ actorId: user.id, action: 'auth.login', entityType: 'session', entityId: null, summary: 'Signed in' , ip: input.ip });
  return { token, expiresAt, user: { id: user.id, name: user.name, role: user.role } };
}

/** Creates a one-time token and returns the raw value. Only its hash is stored. */
async function issueToken(userId: string, purpose: 'SETUP' | 'RESET', createdById: string | null, ttlHours: number) {
  const token = generateToken();
  await db.accountToken.create({
    data: {
      userId,
      tokenHash: sha256(token),
      purpose,
      createdById,
      expiresAt: new Date(Date.now() + ttlHours * 3600_000),
    },
  });
  return token;
}

export function setupUrl(token: string): string {
  return `${getEnv().APP_URL.replace(/\/$/, '')}/admin/set-password?token=${encodeURIComponent(token)}`;
}

export async function createAdministrator(actor: Actor, input: { name: string; email: string; phone: string | null }, ip: string | null) {
  if (!PERMISSIONS.manageAdministrators(actor)) throw errors.forbidden();
  const exists = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (exists) throw errors.unprocessable('An account with this email already exists.', [{ field: 'email', message: 'This email is already in use.' }]);

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name: input.name, email: input.email, phone: input.phone, role: 'ADMIN', status: 'ACTIVE', createdById: actor.id },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });
    await recordAudit({ actorId: actor.id, action: 'admin.create', entityType: 'user', entityId: created.id, summary: `Created administrator account "${created.name}"`, ip }, tx);
    return created;
  });
  const token = await issueToken(user.id, 'SETUP', actor.id, SETUP_TTL_HOURS);
  return { user, setupUrl: setupUrl(token), setupExpiresInHours: SETUP_TTL_HOURS };
}

export async function updateAdministrator(actor: Actor, targetId: string, input: { name: string; email: string; phone: string | null }, ip: string | null) {
  if (!PERMISSIONS.manageAdministrators(actor)) throw errors.forbidden();
  const target = await db.user.findFirst({ where: { id: targetId, deletedAt: null } });
  if (!target) throw errors.notFound('Administrator');
  const clash = await db.user.findFirst({ where: { email: input.email, NOT: { id: targetId } }, select: { id: true } });
  if (clash) throw errors.unprocessable('Another account already uses this email.', [{ field: 'email', message: 'This email is already in use.' }]);
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: targetId }, data: { name: input.name, email: input.email, phone: input.phone } });
    await recordAudit({ actorId: actor.id, action: 'admin.update', entityType: 'user', entityId: targetId, summary: `Updated administrator details for "${input.name}"`, ip }, tx);
  });
  return { id: targetId };
}

export async function setAdministratorStatus(actor: Actor, targetId: string, status: 'ACTIVE' | 'INACTIVE', ip: string | null) {
  if (!PERMISSIONS.manageAdministrators(actor)) throw errors.forbidden();
  const target = await db.user.findFirst({ where: { id: targetId, deletedAt: null }, select: { id: true, name: true, role: true, status: true } });
  if (!target) throw errors.notFound('Administrator');
  if (target.status === status) return { id: targetId, status };
  if (status === 'INACTIVE') {
    const activeSuper = await db.user.count({ where: { role: 'SUPER_ADMIN', status: 'ACTIVE', deletedAt: null } });
    const check = canDeactivateAdministrator({ actorId: actor.id, target, activeSuperAdminCount: activeSuper });
    if (!check.allowed) throw errors.conflict(check.reason!);
  }
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: targetId }, data: { status } });
    await recordAudit(
      { actorId: actor.id, action: status === 'ACTIVE' ? 'admin.activate' : 'admin.deactivate', entityType: 'user', entityId: targetId, summary: `${status === 'ACTIVE' ? 'Activated' : 'Deactivated'} administrator "${target.name}"`, ip },
      tx,
    );
  });
  if (status === 'INACTIVE') await revokeAllSessions(targetId);
  return { id: targetId, status };
}

/** Issues a fresh one-time reset link and revokes existing sessions for that account. */
export async function resetAdministratorCredentials(actor: Actor, targetId: string, ip: string | null) {
  if (!PERMISSIONS.manageAdministrators(actor)) throw errors.forbidden();
  const target = await db.user.findFirst({ where: { id: targetId, deletedAt: null }, select: { id: true, name: true } });
  if (!target) throw errors.notFound('Administrator');
  await db.accountToken.updateMany({ where: { userId: targetId, usedAt: null }, data: { usedAt: new Date() } });
  await revokeAllSessions(targetId);
  const token = await issueToken(targetId, 'RESET', actor.id, RESET_TTL_HOURS);
  await db.$transaction(async (tx) => {
    await recordAudit({ actorId: actor.id, action: 'admin.reset_credentials', entityType: 'user', entityId: targetId, summary: `Issued a credential reset link for "${target.name}"`, ip }, tx);
  });
  return { setupUrl: setupUrl(token), expiresInHours: RESET_TTL_HOURS };
}

export async function removeAdministrator(actor: Actor, targetId: string, ip: string | null) {
  if (!PERMISSIONS.manageAdministrators(actor)) throw errors.forbidden();
  const target = await db.user.findFirst({ where: { id: targetId, deletedAt: null }, select: { id: true, name: true, role: true, status: true } });
  if (!target) throw errors.notFound('Administrator');
  const [activeSuperAdminCount, ownedPropertyCount] = await Promise.all([
    db.user.count({ where: { role: 'SUPER_ADMIN', status: 'ACTIVE', deletedAt: null } }),
    db.property.count({ where: { ownerId: targetId } }),
  ]);
  const check = canRemoveAdministrator({ actorId: actor.id, target, activeSuperAdminCount, ownedPropertyCount });
  if (!check.allowed) throw errors.conflict(check.reason!);
  await db.$transaction(async (tx) => {
    // Soft removal: the row (and audit history) is kept, the account can no longer sign in,
    // and the email address is released for reuse.
    await tx.user.update({
      where: { id: targetId },
      data: { deletedAt: new Date(), status: 'INACTIVE', email: `removed-${targetId}@removed.invalid`, passwordHash: null },
    });
    await recordAudit({ actorId: actor.id, action: 'admin.remove', entityType: 'user', entityId: targetId, summary: `Removed administrator account "${target.name}" (soft delete)`, ip }, tx);
  });
  await revokeAllSessions(targetId);
  await db.accountToken.deleteMany({ where: { userId: targetId } });
  return { id: targetId };
}

/** Consumes a setup or reset token and sets the password. */
export async function consumeAccountToken(token: string, password: string, ip: string | null) {
  const perIp = await consumeRateLimit(`token:ip:${ip ?? 'unknown'}`, 30, 15 * 60);
  if (!perIp.allowed) throw errors.rateLimited(perIp.retryAfterSeconds);

  const row = await db.accountToken.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  const now = new Date();
  if (!row || row.usedAt || row.expiresAt <= now || !row.user || row.user.deletedAt || row.user.status !== 'ACTIVE') {
    throw new ApiError(400, 'TOKEN_INVALID', 'This link is invalid or has expired. Ask a Super Admin for a new link.');
  }
  const issues = passwordIssues(password, row.user.email);
  if (issues.length) throw errors.unprocessable(issues[0]!, issues.map((message) => ({ field: 'password', message })));

  const passwordHash = await hashPassword(password);
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: row.userId }, data: { passwordHash, failedLoginCount: 0, lockedUntil: null } });
    await tx.accountToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: now } });
    await recordAudit({ actorId: row.userId, action: 'admin.password_changed', entityType: 'user', entityId: row.userId, summary: 'Password set using a one-time link', ip }, tx);
  });
  await revokeAllSessions(row.userId);
  return { userId: row.userId };
}

export async function changeOwnPassword(actor: Actor, sessionId: string, current: string, next: string, ip: string | null) {
  const perUser = await consumeRateLimit(`pwchange:${actor.id}`, 10, 15 * 60);
  if (!perUser.allowed) throw errors.rateLimited(perUser.retryAfterSeconds);
  const user = await db.user.findUnique({ where: { id: actor.id }, select: { passwordHash: true, email: true } });
  if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, current))) {
    throw errors.unprocessable('The current password is incorrect.', [{ field: 'currentPassword', message: 'The current password is incorrect.' }]);
  }
  const issues = passwordIssues(next, user.email);
  if (issues.length) throw errors.unprocessable(issues[0]!, issues.map((message) => ({ field: 'newPassword', message })));
  const passwordHash = await hashPassword(next);
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: actor.id }, data: { passwordHash } });
    await recordAudit({ actorId: actor.id, action: 'admin.password_changed', entityType: 'user', entityId: actor.id, summary: 'Changed own password', ip }, tx);
  });
  // Sign out every other session; the current session stays active.
  await revokeAllSessions(actor.id, sessionId);
  return { ok: true };
}

export { isActiveSuperAdmin };
