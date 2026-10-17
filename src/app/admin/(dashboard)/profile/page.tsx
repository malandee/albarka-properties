import { requirePageSession } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProfileDetailsForm, ChangePasswordForm } from '@/components/admin/ProfileForms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My profile' };

export default async function ProfilePage() {
  const session = await requirePageSession('/admin/profile');
  const u = await db.user.findUniqueOrThrow({ where: { id: session.actor.id }, select: { name: true, email: true, phone: true, role: true, lastLoginAt: true } });
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="My profile"
        intro={`Signed in as ${u.email}. Role: ${u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrator'}. Last sign-in ${u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'now'}.`}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <ProfileDetailsForm initialName={u.name} initialPhone={u.phone ?? ''} />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
