import { requirePageSuperAdmin } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { PAGE_SIZE } from '@/lib/validation/property';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Activity log' };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePageSuperAdmin('/admin/activity');
  const sp = await searchParams;
  const page = Math.min(Math.max(1, Number(sp.page ?? 1) || 1), 10_000);
  const [total, items] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, action: true, entityType: true, summary: true, createdAt: true, actor: { select: { name: true } } },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Super Admin" title="Activity log" intro="A record of sign-ins, listing changes, administrator changes, and settings updates. Passwords and tokens are never recorded." />
      {items.length === 0 ? (
        <EmptyState title="No activity yet" description="Actions taken in the admin area will be listed here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-support">
            <caption className="sr-only">Administrative activity, newest first</caption>
            <thead className="border-b border-neutral-border bg-neutral-alt text-neutral-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">When</th>
                <th scope="col" className="px-4 py-3 font-semibold">Who</th>
                <th scope="col" className="px-4 py-3 font-semibold">Action</th>
                <th scope="col" className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b border-neutral-border last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-muted">{formatDateTime(a.createdAt)}</td>
                  <td className="px-4 py-3">{a.actor?.name ?? 'System'}</td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem]">{a.action}</td>
                  <td className="px-4 py-3 text-neutral-text">{a.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination basePath="/admin/activity" params={{}} page={page} pageCount={pageCount} />
    </div>
  );
}
