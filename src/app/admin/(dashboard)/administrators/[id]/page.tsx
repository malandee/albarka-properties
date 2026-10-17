import { notFound } from 'next/navigation';
import { requirePageSuperAdmin } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { AdministratorForm } from '@/components/admin/AdministratorForm';
import { AdministratorActions } from '@/components/admin/AdministratorActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administrator' };

export default async function AdministratorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePageSuperAdmin(`/admin/administrators/${id}`);
  if (!/^[a-z0-9]{10,40}$/i.test(id)) notFound();
  const u = await db.user.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, email: true, phone: true, role: true, status: true, passwordHash: true, createdAt: true, lastLoginAt: true, _count: { select: { properties: true } } },
  });
  if (!u) notFound();
  const isSelf = u.id === session.actor.id;
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[{ label: 'Administrators', href: '/admin/administrators' }, { label: u.name }]}
        eyebrow={u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrator'}
        title={u.name}
        intro={`${u.status === 'ACTIVE' ? 'Active' : 'Deactivated'} · ${u._count.properties} listing${u._count.properties === 1 ? '' : 's'} · Added ${formatDateTime(u.createdAt)} · Last sign-in ${u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'never'}`}
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="max-w-xl">
          <AdministratorForm mode="edit" id={u.id} initial={{ name: u.name, email: u.email, phone: u.phone ?? '' }} />
        </div>
        <div className="card p-5 md:p-6">
          <h2 className="text-card text-brand-ink">Account actions</h2>
          <p className="mt-2 mb-5 text-support text-neutral-muted">
            {u.passwordHash ? 'This account has a password.' : 'This account has not set a password yet. Issue a setup link.'}
          </p>
          <AdministratorActions id={u.id} name={u.name} status={u.status} isSelf={isSelf} isSuper={true} hasPassword={!!u.passwordHash} properties={u._count.properties} />
        </div>
      </div>
    </div>
  );
}
