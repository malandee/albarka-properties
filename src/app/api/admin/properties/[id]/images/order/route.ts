import { requireAdmin } from '@/lib/auth/guards';
import { reorderImages } from '@/lib/property/service';
import { imageOrderSchema } from '@/lib/validation/property';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { actor } = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson(req, imageOrderSchema);
    return ok(await reorderImages(actor, id, body.imageIds, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.images.order');
  }
}
