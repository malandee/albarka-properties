import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getEnv } from '@/lib/env';
import { generateToken, sha256 } from '@/lib/security/crypto';
import type { Actor, Role, AccountStatus } from './policy';

export const SESSION_COOKIE = 'albarka_session';
const LAST_SEEN_WRITE_INTERVAL_MS = 60_000;

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: getEnv().APP_URL.startsWith('https://'),
    path: '/',
    expires,
  };
}

/** Creates a session row and returns the raw token (sent only in the cookie). */
export async function createSession(userId: string, userAgent: string | null) {
  const env = getEnv();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.SESSION_MAX_HOURS * 3600_000);
  await db.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt,
      lastSeenAt: now,
      userAgent: userAgent?.slice(0, 255) ?? null,
    },
  });
  return { token, expiresAt };
}

export async function revokeSessionByToken(token: string | undefined | null) {
  if (!token) return;
  await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
}

export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  await db.session.deleteMany({
    where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
  });
}

export interface CurrentSession {
  actor: Actor & { name: string; email: string };
  sessionId: string;
}

/**
 * Resolves the current session from the cookie and verifies it against the database.
 * Enforces absolute expiry, idle expiry, and account status on every call.
 */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length < 20 || token.length > 200) return null;

  const env = getEnv();
  const row = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true, status: true, deletedAt: true } } },
  });
  if (!row) return null;

  const now = Date.now();
  const idleLimit = env.SESSION_IDLE_MINUTES * 60_000;
  if (row.expiresAt.getTime() <= now || now - row.lastSeenAt.getTime() > idleLimit) {
    await db.session.delete({ where: { id: row.id } }).catch(() => undefined);
    return null;
  }
  if (!row.user || row.user.deletedAt || row.user.status !== 'ACTIVE') {
    // Deactivated or removed accounts lose access immediately.
    await db.session.delete({ where: { id: row.id } }).catch(() => undefined);
    return null;
  }

  if (now - row.lastSeenAt.getTime() > LAST_SEEN_WRITE_INTERVAL_MS) {
    await db.session.update({ where: { id: row.id }, data: { lastSeenAt: new Date(now) } }).catch(() => undefined);
    await db.user.update({ where: { id: row.user.id }, data: { lastActivityAt: new Date(now) } }).catch(() => undefined);
  }

  return {
    sessionId: row.id,
    actor: {
      id: row.user.id,
      name: row.user.name,
      email: row.user.email,
      role: row.user.role as Role,
      status: row.user.status as AccountStatus,
    },
  };
}
