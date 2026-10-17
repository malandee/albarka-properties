import { NextResponse } from 'next/server';
import { login } from '@/lib/auth/accounts';
import { sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validation/account';
import { clientIp, readJson, toResponse } from '@/lib/http';

export async function POST(req: Request) {
  try {
    const body = await readJson(req, loginSchema);
    const result = await login({
      email: body.email,
      password: body.password,
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent'),
    });
    const res = NextResponse.json({ ok: true, data: { user: result.user } }, { headers: { 'Cache-Control': 'no-store' } });
    res.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(result.expiresAt));
    return res;
  } catch (err) {
    return toResponse(err, 'auth.login');
  }
}
