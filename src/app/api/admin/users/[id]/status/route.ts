import { requireSuperAdmin } from '@/lib/auth/guards';
import { setAdministratorStatus } from '@/lib/auth/accounts';
import { adminStatusSchema } from '@/lib/validation/account';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { actor } = await requireSuperAdmin();
    const { id } = await ctx.params;
    const body = await readJson(req, adminStatusSchema);
    return ok(await setAdministratorStatus(actor, id, body.status, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.users.status');
  }
}
