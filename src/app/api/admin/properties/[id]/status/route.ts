import { requireAdmin } from '@/lib/auth/guards';
import { changeAvailability } from '@/lib/property/service';
import { statusSchema } from '@/lib/validation/property';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { actor } = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson(req, statusSchema);
    return ok(await changeAvailability(actor, id, body.availabilityStatus, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.properties.status');
  }
}
