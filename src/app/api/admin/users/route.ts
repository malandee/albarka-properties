import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { createAdministrator } from '@/lib/auth/accounts';
import { adminCreateSchema } from '@/lib/validation/account';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';
import { PAGE_SIZE } from '@/lib/validation/property';

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
    const page = Math.min(Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1), 10_000);
    const where = {
      deletedAt: null,
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }] } : {}),
    };
    const [total, items] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: { id: true, name: true, email: true, phone: true, role: true, status: true, createdAt: true, lastLoginAt: true, lastActivityAt: true, passwordHash: true, _count: { select: { properties: true } } },
      }),
    ]);
    return ok({
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      items: items.map(({ passwordHash, _count, ...u }) => ({ ...u, hasPassword: !!passwordHash, properties: _count.properties })),
    });
  } catch (err) {
    return toResponse(err, 'admin.users.list');
  }
}

export async function POST(req: Request) {
  try {
    const { actor } = await requireSuperAdmin();
    const body = await readJson(req, adminCreateSchema);
    const result = await createAdministrator(actor, body, clientIp(req));
    return ok(result, { status: 201 });
  } catch (err) {
    return toResponse(err, 'admin.users.create');
  }
}
