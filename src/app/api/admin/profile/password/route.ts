import { changeOwnPassword } from '@/lib/auth/accounts';
import { requireAdmin } from '@/lib/auth/guards';
import { changePasswordSchema } from '@/lib/validation/account';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const { actor, sessionId } = await requireAdmin();
    const body = await readJson(req, changePasswordSchema);
    await changeOwnPassword(actor, sessionId, body.currentPassword, body.newPassword, clientIp(req));
    return ok({ message: 'Your password has been changed. Other devices have been signed out.' });
  } catch (err) {
    return toResponse(err, 'admin.password');
  }
}
