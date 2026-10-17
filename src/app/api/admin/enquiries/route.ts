import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { ok, toResponse } from '@/lib/http';
import { PAGE_SIZE } from '@/lib/validation/property';

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
    const url = new URL(req.url);
    const page = Math.min(Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1), 10_000);
    const [total, items] = await Promise.all([
      db.contactEnquiry.count(),
      db.contactEnquiry.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: { id: true, name: true, email: true, phone: true, subject: true, message: true, propertyRef: true, status: true, createdAt: true },
      }),
    ]);
    return ok({ total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), items });
  } catch (err) {
    return toResponse(err, 'admin.enquiries.list');
  }
}
