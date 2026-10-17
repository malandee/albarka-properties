import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { createCatalogueItem, type CatalogueKind } from '@/lib/catalogue';
import { catalogueItemSchema } from '@/lib/validation/account';
import { clientIp, errors, ok, readJson, toResponse } from '@/lib/http';

function kindOf(raw: string): CatalogueKind {
  if (raw === 'categories' || raw === 'category') return 'category';
  if (raw === 'features' || raw === 'feature') return 'feature';
  throw errors.notFound('Catalogue');
}

export async function POST(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  try {
    const { actor } = await requireSuperAdmin();
    const kind = kindOf((await ctx.params).kind);
    const body = await readJson(req, catalogueItemSchema.extend({ label: z.string().trim().min(2).max(80) }));
    return ok(await createCatalogueItem(actor, kind, body, clientIp(req)), { status: 201 });
  } catch (err) {
    return toResponse(err, 'admin.catalogue.create');
  }
}
