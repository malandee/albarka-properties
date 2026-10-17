import { NextResponse } from 'next/server';
import { z } from 'zod';

/** Error with a safe, client-facing message. Internal details are logged, never returned. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errors = {
  unauthenticated: () => new ApiError(401, 'UNAUTHENTICATED', 'Please sign in to continue.'),
  forbidden: () => new ApiError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'),
  notFound: (what = 'Record') => new ApiError(404, 'NOT_FOUND', `${what} was not found.`),
  conflict: (message: string) => new ApiError(409, 'CONFLICT', message),
  unprocessable: (message: string, details?: unknown) => new ApiError(422, 'UNPROCESSABLE', message, details),
  rateLimited: (retryAfter: number) =>
    new ApiError(429, 'RATE_LIMITED', `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minute(s).`),
  validation: (issues: z.ZodIssue[]) =>
    new ApiError(
      400,
      'VALIDATION_FAILED',
      'Some fields need attention.',
      issues.map((i) => ({ field: i.path.join('.') || 'form', message: i.message })),
    ),
};

export function ok<T>(data: T, init?: { status?: number; headers?: HeadersInit }) {
  return NextResponse.json({ ok: true, data }, { status: init?.status ?? 200, headers: init?.headers });
}

export function fail(error: ApiError) {
  return NextResponse.json(
    { ok: false, error: { code: error.code, message: error.message, details: error.details ?? null } },
    { status: error.status, headers: { 'Cache-Control': 'no-store' } },
  );
}

/** Converts unknown errors into a safe response and logs the detail server-side. */
export function toResponse(err: unknown, context: string) {
  if (err instanceof ApiError) return fail(err);
  if (err instanceof z.ZodError) return fail(errors.validation(err.issues));
  console.error(`[${context}]`, err);
  return fail(new ApiError(500, 'INTERNAL', 'Something went wrong. Please try again.'));
}

/** Parses a JSON body with a strict schema. Unknown keys are rejected (mass-assignment protection). */
export async function readJson<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'The request body must be valid JSON.');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw errors.validation(parsed.error.issues);
  return parsed.data;
}

export function clientIp(req: Request): string | null {
  if (process.env.TRUST_PROXY === 'true') {
    const fwd = req.headers.get('x-forwarded-for');
    if (fwd) return fwd.split(',')[0]!.trim();
    return req.headers.get('x-real-ip');
  }
  return null;
}
