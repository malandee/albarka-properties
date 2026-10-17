import { requireSuperAdmin } from '@/lib/auth/guards';
import { updateCatalogueItem, type CatalogueKind } from '@/lib/catalogue';
import { catalogueItemSchema } from '@/lib/validation/account';
import { clientIp, errors, ok, readJson, toResponse } from '@/lib/http';

function kindOf(raw: string): CatalogueKind {
  if (raw === 'categories' || raw === 'category') return 'category';
  if (raw === 'features' || raw === 'feature') return 'feature';
  throw errors.notFound('Catalogue');
}

export async function PATCH(req: Request, ctx: { params: Promise<{ kind: string; id: string }> }) {
  try {
    const { actor } = await requireSuperAdmin();
    const { kind, id } = await ctx.params;
    const body = await readJson(req, catalogueItemSchema.partial());
    return ok(await updateCatalogueItem(actor, kindOf(kind), id, body, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.catalogue.update');
  }
}
