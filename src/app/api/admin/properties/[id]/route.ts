import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guards';
import { loadManageableProperty } from '@/lib/property/access';
import { deleteProperty, updateProperty } from '@/lib/property/service';
import { propertyContentSchema } from '@/lib/validation/property';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { actor } = await requireAdmin();
    const { id } = await ctx.params;
    const base = await loadManageableProperty(actor, id);
    const full = await db.property.findUniqueOrThrow({
      where: { id: base.id },
      include: {
        category: { select: { id: true, name: true } },
        features: { select: { featureId: true } },
        images: { orderBy: [{ sortOrder: 'asc' }], select: { id: true, storageKey: true, altText: true, sortOrder: true, isFeatured: true, width: true, height: true } },
        owner: { select: { id: true, name: true } },
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, fromStatus: true, toStatus: true, fromVisibility: true, toVisibility: true, createdAt: true, changedBy: { select: { name: true } } } },
      },
    });
    return ok({
      ...full,
      priceAmount: full.priceAmount?.toString() ?? null,
      latitude: full.latitude?.toString() ?? null,
      longitude: full.longitude?.toString() ?? null,
      landSizeSqm: full.landSizeSqm?.toString() ?? null,
      buildingSizeSqm: full.buildingSizeSqm?.toString() ?? null,
      features: full.features.map((f) => f.featureId),
    });
  } catch (err) {
    return toResponse(err, 'admin.properties.get');
  }
}

/** Content fields only. Status, visibility, and owner each have their own audited endpoint. */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { actor } = await requireAdmin();
    const { id } = await ctx.params;
    const body = await readJson(req, propertyContentSchema);
    return ok(await updateProperty(actor, id, body, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.properties.update');
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { actor } = await requireAdmin();
    const { id } = await ctx.params;
    return ok(await deleteProperty(actor, id, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.properties.delete');
  }
}
