/**
 * Browser-side helper for the JSON API. Every response uses { ok, data } or { ok, error }.
 * Field-level validation details are preserved so forms can show messages next to inputs.
 */
export interface FieldIssue {
  field: string;
  message: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public fields: FieldIssue[] = [],
  ) {
    super(message);
  }
}

export async function apiRequest<T = unknown>(url: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (init.form) {
    body = init.form;
  } else if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }
  let res: Response;
  try {
    res = await fetch(url, { method: init.method ?? (body ? 'POST' : 'GET'), headers, body, credentials: 'same-origin', cache: 'no-store' });
  } catch {
    throw new ApiClientError('We could not reach the server. Check your connection and try again.', 0, 'NETWORK');
  }
  let json: { ok?: boolean; data?: T; error?: { code: string; message: string; details?: FieldIssue[] | null } } | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok || !json?.ok) {
    const e = json?.error;
    const fields = Array.isArray(e?.details) ? (e!.details as FieldIssue[]) : [];
    throw new ApiClientError(e?.message ?? 'Something went wrong. Please try again.', res.status, e?.code ?? 'ERROR', fields);
  }
  return json.data as T;
}

/** Maps field issues onto a flat record for inline display. */
export function fieldErrorMap(err: unknown): Record<string, string> {
  if (!(err instanceof ApiClientError)) return {};
  return Object.fromEntries(err.fields.map((f) => [f.field, f.message]));
}
