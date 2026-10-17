import { consumeAccountToken } from '@/lib/auth/accounts';
import { setPasswordSchema } from '@/lib/validation/account';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const body = await readJson(req, setPasswordSchema);
    await consumeAccountToken(body.token, body.password, clientIp(req));
    return ok({ message: 'Your password has been set. You can now sign in.' });
  } catch (err) {
    return toResponse(err, 'auth.set-password');
  }
}
