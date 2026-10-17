import { requirePageSuperAdmin } from '@/lib/auth/guards';
import { PageHeader } from '@/components/ui/PageHeader';
import { AdministratorForm } from '@/components/admin/AdministratorForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add an administrator' };

export default async function NewAdministratorPage() {
  await requirePageSuperAdmin('/admin/administrators/new');
  return (
    <div className="space-y-8">
      <PageHeader breadcrumbs={[{ label: 'Administrators', href: '/admin/administrators' }, { label: 'Add' }]} title="Add an administrator" intro="The new administrator sets their own password using a one-time link. Only the link is shown here, once." />
      <div className="max-w-xl">
        <AdministratorForm mode="create" />
      </div>
    </div>
  );
}
