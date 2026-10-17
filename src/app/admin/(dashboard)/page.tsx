import Link from 'next/link';
import { requirePageSession } from '@/lib/auth/guards';
import { PERMISSIONS } from '@/lib/auth/policy';
import { dashboardStats } from '@/lib/property/catalogue';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge, VisibilityBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const session = await requirePageSession('/admin');
  const { actor } = session;
  const sp = await searchParams;
  const stats = await dashboardStats(actor);
  const isSuper = PERMISSIONS.manageAdministrators(actor);
  const newEnquiries = isSuper ? await db.contactEnquiry.count({ where: { status: 'NEW' } }) : 0;
  const recent = await db.property.findMany({
    where: actor.role === 'SUPER_ADMIN' ? {} : { ownerId: actor.id },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: 5,
    select: { id: true, title: true, availabilityStatus: true, visibility: true, updatedAt: true },
  });

  const cards = [
    { label: 'Listings', value: stats.total, href: '/admin/properties' },
    { label: 'Shown publicly', value: stats.visible, href: '/admin/properties?visibility=PUBLIC' },
    { label: 'Hidden', value: stats.hidden, href: '/admin/properties?visibility=HIDDEN' },
    { label: 'Available', value: stats.available, href: '/admin/properties?status=AVAILABLE' },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={isSuper ? 'Super Admin' : 'Administrator'}
        title={`Welcome, ${actor.name.split(' ')[0]}`}
        intro={isSuper ? 'Overview of every listing, administrator, and enquiry.' : 'Overview of your listings. You can see and manage only the listings you created.'}
        actions={
          <Link href="/admin/properties/new" className="btn-primary">
            Add a property
          </Link>
        }
      />

      {sp.notice === 'super-admin-only' && (
        <p role="status" className="rounded-md border border-neutral-border bg-white p-4 text-support text-neutral-text">
          That page is available to Super Admins only.
        </p>
      )}

      <section aria-labelledby="stats-heading" className="space-y-4">
        <h2 id="stats-heading" className="sr-only">Listing figures</h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <li key={c.label}>
              <Link href={c.href} className="card block p-5 transition-colors duration-200 ease-std hover:border-brand-deep">
                <p className="text-support text-neutral-muted">{c.label}</p>
                <p className="mt-2 text-[2rem] font-bold leading-none text-brand-ink">{c.value}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-support text-neutral-muted">
          {stats.recentlyUpdated} listing{stats.recentlyUpdated === 1 ? '' : 's'} updated in the last 7 days.
        </p>
      </section>

      {isSuper && 'activeAdmins' in stats && (
        <section aria-labelledby="team-heading" className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="card p-5 md:p-6">
            <h2 id="team-heading" className="text-card text-brand-ink">Team</h2>
            <p className="mt-2 text-support text-neutral-text">
              {stats.activeAdmins} active of {stats.totalAdmins} administrator accounts.
            </p>
            <Link href="/admin/administrators" className="mt-4 inline-flex text-support font-semibold text-brand-deep hover:underline">
              Manage administrators
            </Link>
          </div>
          <div className="card p-5 md:p-6">
            <h2 className="text-card text-brand-ink">New enquiries</h2>
            <p className="mt-2 text-support text-neutral-text">
              {newEnquiries} enquir{newEnquiries === 1 ? 'y' : 'ies'} waiting for a first response.
            </p>
            <Link href="/admin/enquiries?status=NEW" className="mt-4 inline-flex text-support font-semibold text-brand-deep hover:underline">
              Open enquiries
            </Link>
          </div>
          <div className="card p-5 md:p-6 lg:col-span-2">
            <h2 className="text-card text-brand-ink">Listings per administrator</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-support">
                <caption className="sr-only">Number of listings owned by each administrator</caption>
                <thead>
                  <tr className="border-b border-neutral-border text-neutral-muted">
                    <th scope="col" className="py-2 pr-4 font-semibold">Administrator</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Role</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Account</th>
                    <th scope="col" className="py-2 text-right font-semibold">Listings</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perAdmin.map((a) => (
                    <tr key={a.id} className="border-b border-neutral-border last:border-0">
                      <td className="py-3 pr-4 font-semibold text-brand-ink">{a.name}</td>
                      <td className="py-3 pr-4">{a.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrator'}</td>
                      <td className="py-3 pr-4">{a.status === 'ACTIVE' ? 'Active' : 'Deactivated'}</td>
                      <td className="py-3 text-right tabular-nums">{a.properties}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="recent-heading" className="card p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id="recent-heading" className="text-card text-brand-ink">Recently updated listings</h2>
          <Link href="/admin/properties" className="text-support font-semibold text-brand-deep hover:underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-support text-neutral-muted">No listings yet. <Link href="/admin/properties/new" className="font-semibold text-brand-deep underline">Add the first one</Link>.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-border">
            {recent.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/admin/properties/${p.id}`} className="font-semibold text-brand-ink hover:text-brand-deep hover:underline">
                  {p.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <VisibilityBadge visibility={p.visibility} />
                  <StatusBadge status={p.availabilityStatus} />
                  <span className="text-[0.8125rem] text-neutral-muted">Updated {formatDateTime(p.updatedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
