import { redirect } from 'next/navigation';
import { ApiError, errors } from '@/lib/http';
import { getCurrentSession, type CurrentSession } from './session';
import { PERMISSIONS, type Actor } from './policy';

/** Route handlers: returns the session or throws a 401 ApiError. */
export async function requireSession(): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session) throw errors.unauthenticated();
  return session;
}

/** Route handlers: any active administrator (Admin or Super Admin). */
export async function requireAdmin(): Promise<CurrentSession> {
  return requireSession();
}

/** Route handlers: Super Admin only. */
export async function requireSuperAdmin(): Promise<CurrentSession> {
  const session = await requireSession();
  if (!PERMISSIONS.manageAdministrators(session.actor)) throw errors.forbidden();
  return session;
}

/** Server components and layouts: redirects unauthenticated visitors to the login page. */
export async function requirePageSession(nextPath: string): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(safeNextPath(nextPath))}`);
  }
  return session;
}

/** Server components: Super Admin only. Admins are sent to their dashboard. */
export async function requirePageSuperAdmin(nextPath: string): Promise<CurrentSession> {
  const session = await requirePageSession(nextPath);
  if (!PERMISSIONS.manageAdministrators(session.actor)) redirect('/admin?notice=super-admin-only');
  return session;
}

/** Only same-site relative admin paths are accepted after login (prevents open redirects). */
export function safeNextPath(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '/admin';
  if (!input.startsWith('/admin')) return '/admin';
  if (input.startsWith('//') || input.includes('\\') || /[\r\n]/.test(input)) return '/admin';
  return input;
}

export function assertActor(actor: Actor | null): asserts actor is Actor {
  if (!actor) throw errors.unauthenticated();
}

export { ApiError };
