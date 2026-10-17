import { getCurrentSession } from '@/lib/auth/session';
import { fail, ok, toResponse } from '@/lib/http';
import { ApiError } from '@/lib/http';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) return fail(new ApiError(401, 'UNAUTHENTICATED', 'Please sign in to continue.'));
    return ok({ id: session.actor.id, name: session.actor.name, email: session.actor.email, role: session.actor.role });
  } catch (err) {
    return toResponse(err, 'auth.me');
  }
}
