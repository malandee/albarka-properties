import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revokeSessionByToken, SESSION_COOKIE } from '@/lib/auth/session';
import { toResponse } from '@/lib/http';

export async function POST() {
  try {
    const store = await cookies();
    await revokeSessionByToken(store.get(SESSION_COOKIE)?.value);
    const res = NextResponse.json({ ok: true, data: { signedOut: true } }, { headers: { 'Cache-Control': 'no-store' } });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  } catch (err) {
    return toResponse(err, 'auth.logout');
  }
}
