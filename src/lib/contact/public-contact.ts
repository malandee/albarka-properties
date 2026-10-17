import { cache } from 'react';
import { db } from '@/lib/db';
import { errors } from '@/lib/http';
import { recordAudit } from '@/lib/audit';
import { PERMISSIONS, type Actor } from '@/lib/auth/policy';
import {
  defaultPublicContact,
  publicContactSchema,
  storedContactSchema,
  type PublicContact,
  type PublicContactInput,
  type StoredContact,
} from './rules';

export { defaultPublicContact };

export const PUBLIC_CONTACT_KEY = 'publicContact';

function fromStored(stored: StoredContact): PublicContact {
  return {
    email: stored.email,
    address: stored.address,
    phones: stored.phones.map((p) => ({ label: p.label, tel: p.tel, published: p.published })),
    whatsapp: stored.whatsapp,
  };
}

/**
 * Current public contact details: the saved override if one exists, otherwise the defaults.
 * Cached per request so the header, footer, and page share one read.
 */
export const getPublicContact = cache(async (): Promise<PublicContact> => {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: PUBLIC_CONTACT_KEY }, select: { value: true } });
    if (!row) return defaultPublicContact();
    const parsed = storedContactSchema.safeParse(JSON.parse(row.value));
    return parsed.success ? fromStored(parsed.data) : defaultPublicContact();
  } catch (err) {
    // Fall back to the safe defaults (no unpublished phone numbers, no WhatsApp) so pages still render.
    console.error('[contact.read]', err instanceof Error ? err.message : err);
    return defaultPublicContact();
  }
});

/** Super Admin only. Writes the override and an audit entry in one transaction. */
export async function updatePublicContact(actor: Actor, input: unknown, ip: string | null): Promise<PublicContact> {
  if (!PERMISSIONS.manageSettings(actor)) throw errors.forbidden();
  const body: PublicContactInput = publicContactSchema.parse(input);
  const stored: StoredContact = {
    email: body.email,
    address: body.address,
    phones: body.phones.map((p) => ({ label: p.label, tel: p.number, published: p.published })),
    whatsapp: body.whatsapp,
  };
  const value = JSON.stringify(stored);
  const published = stored.phones.filter((p) => p.published).length;
  await db.$transaction(async (tx) => {
    await tx.siteSetting.upsert({
      where: { key: PUBLIC_CONTACT_KEY },
      create: { key: PUBLIC_CONTACT_KEY, value, updatedById: actor.id },
      update: { value, updatedById: actor.id },
    });
    await recordAudit(
      {
        actorId: actor.id,
        action: 'settings.update',
        entityType: 'setting',
        entityId: PUBLIC_CONTACT_KEY,
        summary: `Public contact details updated: ${published} telephone number(s) published, WhatsApp ${stored.whatsapp ? 'configured' : 'not shown'}`,
        ip,
      },
      tx,
    );
  });
  return fromStored(stored);
}
