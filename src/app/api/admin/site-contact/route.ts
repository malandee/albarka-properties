import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { getPublicContact, updatePublicContact } from '@/lib/contact/public-contact';
import { publicContactSchema } from '@/lib/contact/rules';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

export async function GET() {
  try {
    await requireSuperAdmin();
    return ok(await getPublicContact());
  } catch (err) {
    return toResponse(err, 'admin.site-contact.get');
  }
}

export async function PATCH(req: Request) {
  try {
    const { actor } = await requireSuperAdmin();
    const body = await readJson(req, publicContactSchema);
    const saved = await updatePublicContact(actor, body, clientIp(req));
    revalidatePath('/', 'layout');
    return ok(saved);
  } catch (err) {
    return toResponse(err, 'admin.site-contact.patch');
  }
}
