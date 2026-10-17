'use client';

import { ErrorState } from '@/components/ui/States';

export default function PropertiesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-content px-5 py-16 md:px-8">
      <ErrorState
        title="We could not load the catalogue"
        description="There was a problem loading properties. Your search is still in the address bar, so you can retry now."
        onRetry={reset}
      />
    </div>
  );
}
