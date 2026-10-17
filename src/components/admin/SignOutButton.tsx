'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { apiRequest } from '@/lib/client/api';

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      loading={busy}
      loadingLabel="Signing out…"
      onClick={async () => {
        setBusy(true);
        try {
          await apiRequest('/api/auth/logout', { method: 'POST' });
        } finally {
          window.location.assign('/admin/login');
        }
      }}
      className="min-h-10 px-3 text-support"
    >
      Sign out
    </Button>
  );
}
