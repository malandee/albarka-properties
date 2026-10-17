import { requirePageSuperAdmin } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { PAGE_SIZE } from '@/lib/validation/property';
import { SUBJECT_LABELS } from '@/lib/validation/account';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { EnquiryStatusSelect } from '@/components/admin/EnquiryStatusSelect';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Enquiries' };

const STATUSES = ['NEW', 'REVIEWED', 'CLOSED'] as const;

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requirePageSuperAdmin('/admin/enquiries');
  const sp = await searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? '') ? (sp.status as (typeof STATUSES)[number]) : null;
  const page = Math.min(Math.max(1, Number(sp.page ?? 1) || 1), 10_000);
  const where = status ? { status } : {};
  const [total, items] = await Promise.all([
    db.contactEnquiry.count({ where }),
    db.contactEnquiry.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, phone: true, subject: true, message: true, propertyRef: true, status: true, createdAt: true },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const params: Record<string, string> = status ? { status } : {};

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Super Admin" title="Enquiries" intro="Messages sent through the Contact page, newest first. Mark each one as you respond." />
      <nav aria-label="Filter enquiries by status" className="flex flex-wrap gap-2">
        {[{ v: '', l: 'All' }, ...STATUSES.map((s) => ({ v: s, l: s === 'NEW' ? 'New' : s === 'REVIEWED' ? 'Reviewed' : 'Closed' }))].map((o) => (
          <a key={o.v || 'all'} href={o.v ? `/admin/enquiries?status=${o.v}` : '/admin/enquiries'} aria-current={(status ?? '') === o.v ? 'page' : undefined} className={`min-h-10 rounded-md border px-4 py-2 text-support font-semibold ${(status ?? '') === o.v ? 'border-brand-deep bg-brand-deep text-white' : 'border-neutral-border bg-white text-brand-ink hover:border-brand-deep'}`}>
            {o.l}
          </a>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState title="No enquiries here" description={status ? 'Nothing matches this status yet.' : 'Enquiries from the Contact page will appear here.'} />
      ) : (
        <ul className="space-y-4">
          {items.map((e) => (
            <li key={e.id} className="card p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-card text-brand-ink">{e.name}</p>
                  <p className="mt-1 text-support text-neutral-muted">
                    {formatDateTime(e.createdAt)} · {SUBJECT_LABELS[e.subject] ?? e.subject}
                    {e.propertyRef && <> · Property: <span className="font-mono">{e.propertyRef}</span></>}
                  </p>
                  <p className="mt-2 text-support text-neutral-text">
                    {e.email && <a href={`mailto:${e.email}`} className="font-semibold text-brand-deep underline">{e.email}</a>}
                    {e.email && e.phone && ' · '}
                    {e.phone && <a href={`tel:${e.phone.replace(/\s+/g, '')}`} className="font-semibold text-brand-deep underline">{e.phone}</a>}
                  </p>
                </div>
                <EnquiryStatusSelect id={e.id} status={e.status} label={e.name} />
              </div>
              <p className="mt-4 whitespace-pre-line text-body text-neutral-text">{e.message}</p>
            </li>
          ))}
        </ul>
      )}
      <Pagination basePath="/admin/enquiries" params={params} page={page} pageCount={pageCount} />
    </div>
  );
}
