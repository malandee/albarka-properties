import Link from 'next/link';
import { requirePageSuperAdmin } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { PAGE_SIZE } from '@/lib/validation/property';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administrators' };

export default async function AdministratorsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const session = await requirePageSuperAdmin('/admin/administrators');
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 100);
  const page = Math.min(Math.max(1, Number(sp.page ?? 1) || 1), 10_000);
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
      select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true, passwordHash: true, _count: { select: { properties: true } } },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const params: Record<string, string> = q ? { q } : {};

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Super Admin"
        title="Administrators"
        intro="Create administrator accounts, issue one-time setup and reset links, and deactivate accounts that should no longer sign in."
        actions={<Link href="/admin/administrators/new" className="btn-primary">Add an administrator</Link>}
      />
      <form role="search" className="flex flex-col gap-3 sm:flex-row sm:items-end" aria-label="Search administrators">
        <div className="flex-1">
          <label htmlFor="admin-q" className="block text-support font-semibold text-brand-ink">Search by name or email</label>
          <input id="admin-q" name="q" type="search" defaultValue={q} maxLength={100} className="mt-1.5 input" />
        </div>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {items.length === 0 ? (
        <EmptyState title="No administrators found" description={q ? 'Try a different name or email.' : 'Add the first administrator account.'} actions={[{ href: '/admin/administrators/new', label: 'Add an administrator' }]} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-support">
            <caption className="sr-only">Administrator accounts</caption>
            <thead className="border-b border-neutral-border bg-neutral-alt text-neutral-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold">Account</th>
                <th scope="col" className="px-4 py-3 font-semibold">Listings</th>
                <th scope="col" className="px-4 py-3 font-semibold">Last sign-in</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-b border-neutral-border last:border-0">
                  <td className="px-4 py-3 font-semibold text-brand-ink">{u.name}{u.id === session.actor.id && <span className="ml-2 text-[0.8125rem] font-normal text-neutral-muted">(you)</span>}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrator'}</td>
                  <td className="px-4 py-3">
                    {u.status === 'ACTIVE' ? 'Active' : 'Deactivated'}
                    {!u.passwordHash && <span className="ml-2 rounded bg-neutral-alt px-2 py-0.5 text-[0.75rem] font-semibold text-brand-ink">Setup pending</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{u._count.properties}</td>
                  <td className="px-4 py-3 text-neutral-muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/administrators/${u.id}`} className="btn-secondary min-h-10 px-3">Manage<span className="sr-only"> {u.name}</span></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination basePath="/admin/administrators" params={params} page={page} pageCount={pageCount} />
    </div>
  );
}
