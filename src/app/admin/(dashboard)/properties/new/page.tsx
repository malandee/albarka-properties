import { requirePageSession } from '@/lib/auth/guards';
import { PERMISSIONS } from '@/lib/auth/policy';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { PropertyForm, EMPTY_VALUES } from '@/components/admin/PropertyForm';
import { errors } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add a property' };

export default async function NewPropertyPage() {
  const session = await requirePageSession('/admin/properties/new');
  if (!PERMISSIONS.manageProperty(session.actor, { ownerId: session.actor.id })) throw errors.forbidden();
  const [categories, features] = await Promise.all([
    db.propertyCategory.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, name: true } }),
    db.feature.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }], select: { id: true, label: true } }),
  ]);
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[{ label: 'Properties', href: '/admin/properties' }, { label: 'Add a property' }]}
        eyebrow="New listing"
        title="Add a property"
        intro="Describe the property, set its price and location, then save. The listing stays hidden until you add photographs and choose to show it."
      />
      <PropertyForm mode="create" initial={EMPTY_VALUES} categories={categories} features={features} />
    </div>
  );
}
