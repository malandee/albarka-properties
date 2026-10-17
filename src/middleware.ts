import { NextResponse, type NextRequest } from 'next/server';

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF defence for the JSON/multipart API. Session cookies are SameSite=Lax, and state-changing
 * requests must come from the same origin when a browser sends an Origin header.
 */
export function middleware(req: NextRequest) {
  // Expose the current path to server components (used for the post-login redirect).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname + req.nextUrl.search);
  if (!UNSAFE.has(req.method) || !req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  const forbidden = () =>
    NextResponse.json(
      { ok: false, error: { code: 'CSRF_REJECTED', message: 'This request was blocked for security reasons.', details: null } },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );

  if (req.headers.get('sec-fetch-site') === 'cross-site') return forbidden();

  const origin = req.headers.get('origin');
  if (origin) {
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return forbidden();
    }
    if (!host || originHost !== host) return forbidden();
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
