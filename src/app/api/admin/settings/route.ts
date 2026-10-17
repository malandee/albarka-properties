import { requireSuperAdmin } from '@/lib/auth/guards';
import { getFeaturedCount, updateSettings } from '@/lib/catalogue';
import { settingsSchema } from '@/lib/validation/account';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

export async function GET() {
  try {
    await requireSuperAdmin();
    return ok({ featuredCount: await getFeaturedCount() });
  } catch (err) {
    return toResponse(err, 'admin.settings.get');
  }
}

export async function PATCH(req: Request) {
  try {
    const { actor } = await requireSuperAdmin();
    const body = await readJson(req, settingsSchema);
    return ok(await updateSettings(actor, body, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.settings.patch');
  }
}
