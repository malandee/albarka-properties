import { requireAdmin } from '@/lib/auth/guards';
import { listManageableProperties, parseAdminFilters } from '@/lib/property/catalogue';
import { createProperty } from '@/lib/property/service';
import { propertyContentSchema } from '@/lib/validation/property';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

/** Admins receive only their own listings. Super Admins receive all listings. */
export async function GET(req: Request) {
  try {
    const { actor } = await requireAdmin();
    const params = Object.fromEntries(new URL(req.url).searchParams.entries());
    const result = await listManageableProperties(actor, parseAdminFilters(params));
    return ok(result);
  } catch (err) {
    return toResponse(err, 'admin.properties.list');
  }
}

export async function POST(req: Request) {
  try {
    const { actor } = await requireAdmin();
    const body = await readJson(req, propertyContentSchema);
    const created = await createProperty(actor, body, clientIp(req));
    return ok(created, { status: 201 });
  } catch (err) {
    return toResponse(err, 'admin.properties.create');
  }
}
