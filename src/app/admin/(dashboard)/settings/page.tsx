import { requirePageSuperAdmin } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { getFeaturedCount } from '@/lib/catalogue';
import { PageHeader } from '@/components/ui/PageHeader';
import { CatalogueManager, type CatalogueRow } from '@/components/admin/CatalogueManager';
import { FeaturedCountForm } from '@/components/admin/FeaturedCountForm';
import { PublicContactForm } from '@/components/admin/PublicContactForm';
import { getPublicContact } from '@/lib/contact/public-contact';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await requirePageSuperAdmin('/admin/settings');
  const [featuredCount, contact, categories, features] = await Promise.all([
    getFeaturedCount(),
    getPublicContact(),
    db.propertyCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, name: true, active: true, _count: { select: { properties: true } } } }),
    db.feature.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }], select: { id: true, label: true, active: true, _count: { select: { properties: true } } } }),
  ]);
  const catRows: CatalogueRow[] = categories.map((c) => ({ id: c.id, label: c.name, active: c.active, usage: c._count.properties }));
  const featRows: CatalogueRow[] = features.map((f) => ({ id: f.id, label: f.label, active: f.active, usage: f._count.properties }));
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Super Admin" title="Settings" intro="Public contact details, the property types and features administrators choose from, and how many listings the home page features. Corporate settings are changed by Super Admins only, and each change is recorded in the audit log." />
      <PublicContactForm initial={contact} />
      <FeaturedCountForm initial={featuredCount} />
      <CatalogueManager kind="categories" title="Property types" intro="Shown in the listing form and the public filters. Turning one off hides it from new listings; existing listings keep it." items={catRows} />
      <CatalogueManager kind="features" title="Features and amenities" intro="Checkboxes on the listing form. Turning one off hides it from new listings; existing listings keep it." items={featRows} />
    </div>
  );
}
