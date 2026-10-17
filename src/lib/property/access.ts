import { db } from '@/lib/db';
import { ApiError, errors } from '@/lib/http';
import { PERMISSIONS, type Actor } from '@/lib/auth/policy';

/**
 * Loads a property the actor is allowed to manage. Admins who do not own the record receive
 * the same 404 as a missing record, so ownership of other records is not revealed.
 */
export async function loadManageableProperty(actor: Actor, id: string) {
  if (!/^[a-z0-9]{10,40}$/i.test(id)) throw errors.notFound('Property');
  const property = await db.property.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      visibility: true,
      availabilityStatus: true,
      purpose: true,
      slug: true,
      title: true,
      priceAmount: true,
      priceOnRequest: true,
      addressLine: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
    },
  });
  if (!property || !PERMISSIONS.viewProperty(actor, property)) throw errors.notFound('Property');
  return property;
}

export function assertCanModify(actor: Actor, property: { ownerId: string }) {
  if (!PERMISSIONS.manageProperty(actor, property)) throw new ApiError(404, 'NOT_FOUND', 'Property was not found.');
}
