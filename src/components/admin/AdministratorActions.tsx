'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { apiRequest, ApiClientError } from '@/lib/client/api';

interface Props {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  isSelf: boolean;
  isSuper: boolean;
  hasPassword: boolean;
  properties: number;
}

/** Deactivate/reactivate, issue a reset link (shown once), and remove. Server rules are authoritative. */
export function AdministratorActions({ id, name, status, isSelf, isSuper, hasPassword, properties }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'deactivate' | 'remove' | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function act(key: string, fn: () => Promise<unknown>, success: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(success);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'That change could not be made.');
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {status === 'ACTIVE' ? (
          <Button variant="secondary" disabled={isSelf} loading={busy === 'status'} loadingLabel="Deactivating…" onClick={() => setConfirm('deactivate')}>
            Deactivate account
          </Button>
        ) : (
          <Button variant="secondary" loading={busy === 'status'} loadingLabel="Activating…" onClick={() => act('status', () => apiRequest(`/api/admin/users/${id}/status`, { method: 'PATCH', body: { status: 'ACTIVE' } }), `${name} can sign in again.`)}>
            Reactivate account
          </Button>
        )}
        <Button
          variant="secondary"
          loading={busy === 'reset'}
          loadingLabel="Creating link…"
          onClick={async () => {
            setBusy('reset');
            try {
              const data = await apiRequest<{ setupUrl: string }>(`/api/admin/users/${id}/reset`, { method: 'POST' });
              setResetUrl(data.setupUrl);
              toast.success('Reset link created. It is shown once below.');
            } catch (err) {
              toast.error(err instanceof ApiClientError ? err.message : 'The reset link could not be created.');
            } finally {
              setBusy(null);
            }
          }}
        >
          {hasPassword ? 'Issue password reset link' : 'Issue setup link'}
        </Button>
        {isSuper && (
          <Button variant="danger" disabled={isSelf} onClick={() => setConfirm('remove')}>
            Remove administrator
          </Button>
        )}
      </div>
      {isSelf && <p className="text-support text-neutral-muted">You cannot deactivate or remove your own account here. Ask another Super Admin.</p>}

      {resetUrl && (
        <div role="status" className="card space-y-3 p-5">
          <p className="text-support font-semibold text-brand-ink">One-time link for {name}</p>
          <p className="text-support text-neutral-text">It works once and expires within 24 hours. Share it privately. Existing sessions for this account have been signed out.</p>
          <p className="break-all rounded-md bg-neutral-alt p-3 font-mono text-[0.8125rem] text-brand-ink">{resetUrl}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(resetUrl).then(() => toast.success('Link copied.'), () => toast.error('Copy failed. Select the link and copy it manually.'))}>Copy link</Button>
            <Button variant="ghost" onClick={() => setResetUrl(null)}>Hide link</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm === 'deactivate'}
        title={`Deactivate ${name}?`}
        description="The account cannot sign in, and its current sessions end immediately. Its listings stay in place and can be reassigned or managed by a Super Admin."
        confirmLabel="Deactivate"
        destructive
        busy={busy === 'status'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => act('status', () => apiRequest(`/api/admin/users/${id}/status`, { method: 'PATCH', body: { status: 'INACTIVE' } }), `${name} has been deactivated.`)}
      />
      <ConfirmDialog
        open={confirm === 'remove'}
        title={`Remove ${name}?`}
        description={properties > 0 ? `${name} still owns ${properties} listing${properties === 1 ? '' : 's'}. Removal is blocked until those are reassigned or deleted. Deactivate the account instead.` : `This removes ${name}’s access. Their email address becomes available for reuse. The audit history is kept.`}
        confirmLabel="Remove administrator"
        destructive
        busy={busy === 'remove'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => act('remove', () => apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' }), `${name} has been removed.`).then(() => router.push('/admin/administrators'))}
      />
    </div>
  );
}
