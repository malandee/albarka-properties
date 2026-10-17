import { requireAdmin } from '@/lib/auth/guards';
import { changeVisibility } from '@/lib/property/service';
import { visibilitySchema } from '@/lib/validation/property';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { actor } = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson(req, visibilitySchema);
    return ok(await changeVisibility(actor, id, body.visibility, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.properties.visibility');
  }
}
