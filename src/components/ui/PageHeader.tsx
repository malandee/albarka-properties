import { Breadcrumbs } from './Breadcrumbs';

/** Shared page title block: breadcrumb, eyebrow, page heading, and optional intro. */
export function PageHeader({
  title,
  intro,
  eyebrow,
  breadcrumbs,
  actions,
}: {
  title: string;
  intro?: string;
  eyebrow?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-neutral-border bg-white">
      <div className="mx-auto max-w-content px-5 py-10 md:px-8 md:py-14">
        {breadcrumbs && <div className="mb-5"><Breadcrumbs items={breadcrumbs} /></div>}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-prose">
            {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
            <h1 className="text-page">{title}</h1>
            {intro && <p className="mt-4 text-body text-neutral-text">{intro}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
