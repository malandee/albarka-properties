import { requireSuperAdmin } from '@/lib/auth/guards';
import { resetAdministratorCredentials } from '@/lib/auth/accounts';
import { clientIp, ok, toResponse } from '@/lib/http';

/** Returns a one-time link. It is shown once to the Super Admin and is never stored in plaintext. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { actor } = await requireSuperAdmin();
    const { id } = await ctx.params;
    return ok(await resetAdministratorCredentials(actor, id, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.users.reset');
  }
}
