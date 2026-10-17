/**
 * Pure authorization and state rules. No database or framework imports, so these are
 * unit-tested directly. Every server mutation must call these helpers after loading the
 * target record from the database; the UI never decides permissions on its own.
 */

export type Role = 'SUPER_ADMIN' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';
export type ListingPurpose = 'FOR_SALE' | 'FOR_RENT';
export type AvailabilityStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED';
export type Visibility = 'PUBLIC' | 'HIDDEN';

export interface Actor {
  id: string;
  role: Role;
  status: AccountStatus;
}

export interface OwnedRecord {
  ownerId: string;
}

export const PERMISSIONS = {
  /** Super Admin only: view and manage every property. */
  manageAllProperties: (actor: Actor) => isActiveSuperAdmin(actor),
  /** Owner or Super Admin may change a property. */
  manageProperty: (actor: Actor, property: OwnedRecord) =>
    isActiveActor(actor) && (actor.role === 'SUPER_ADMIN' || property.ownerId === actor.id),
  /** Owner or Super Admin may view a property in the management UI. */
  viewProperty: (actor: Actor, property: OwnedRecord) =>
    isActiveActor(actor) && (actor.role === 'SUPER_ADMIN' || property.ownerId === actor.id),
  /** Only Super Admin manages administrator accounts. */
  manageAdministrators: (actor: Actor) => isActiveSuperAdmin(actor),
  /** Only Super Admin reads audit logs, enquiries, and site settings. */
  viewAuditLogs: (actor: Actor) => isActiveSuperAdmin(actor),
  manageSettings: (actor: Actor) => isActiveSuperAdmin(actor),
  /** Nobody may change their own role through the application. */
  changeRole: (_actor: Actor) => false,
} as const;

export function isActiveActor(actor: Actor | null | undefined): actor is Actor {
  return !!actor && actor.status === 'ACTIVE';
}

export function isActiveSuperAdmin(actor: Actor | null | undefined): boolean {
  return isActiveActor(actor) && actor.role === 'SUPER_ADMIN';
}

/**
 * Deleting a property is allowed only after it has been hidden. This prevents accidental
 * removal of a live listing and keeps a deliberate two-step workflow.
 */
export function canDeleteProperty(actor: Actor, property: OwnedRecord & { visibility: Visibility }): {
  allowed: boolean;
  reason?: string;
} {
  if (!PERMISSIONS.manageProperty(actor, property)) return { allowed: false, reason: 'forbidden' };
  if (property.visibility === 'PUBLIC') {
    return { allowed: false, reason: 'Hide the listing before deleting it.' };
  }
  return { allowed: true };
}

/**
 * Administrator removal rules:
 * - Super Admins cannot remove their own account.
 * - The last active Super Admin cannot be removed or deactivated.
 * - Accounts that still own properties cannot be removed; ownership is never transferred silently.
 */
export function canRemoveAdministrator(input: {
  actorId: string;
  target: { id: string; role: Role; status: AccountStatus };
  activeSuperAdminCount: number;
  ownedPropertyCount: number;
}): { allowed: boolean; reason?: string } {
  if (input.actorId === input.target.id) return { allowed: false, reason: 'You cannot remove your own account.' };
  if (input.target.role === 'SUPER_ADMIN' && input.target.status === 'ACTIVE' && input.activeSuperAdminCount <= 1) {
    return { allowed: false, reason: 'The last active Super Admin account cannot be removed.' };
  }
  if (input.ownedPropertyCount > 0) {
    return {
      allowed: false,
      reason: `This administrator still owns ${input.ownedPropertyCount} propert${input.ownedPropertyCount === 1 ? 'y' : 'ies'}. Deactivate the account instead, or reassign or remove those listings first.`,
    };
  }
  return { allowed: true };
}

export function canDeactivateAdministrator(input: {
  actorId: string;
  target: { id: string; role: Role; status: AccountStatus };
  activeSuperAdminCount: number;
}): { allowed: boolean; reason?: string } {
  if (input.actorId === input.target.id) return { allowed: false, reason: 'You cannot deactivate your own account.' };
  if (input.target.role === 'SUPER_ADMIN' && input.target.status === 'ACTIVE' && input.activeSuperAdminCount <= 1) {
    return { allowed: false, reason: 'The last active Super Admin account cannot be deactivated.' };
  }
  return { allowed: true };
}

/**
 * Status rules. Available/Reserved/Sold/Rented are the business statuses. Sale listings
 * can be Sold; rental listings can be Rented. Either may be returned to Available.
 */
export const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  SOLD: 'Sold',
  RENTED: 'Rented',
};

export function allowedStatuses(purpose: ListingPurpose): AvailabilityStatus[] {
  return purpose === 'FOR_SALE' ? ['AVAILABLE', 'RESERVED', 'SOLD'] : ['AVAILABLE', 'RESERVED', 'RENTED'];
}

export function isStatusTransitionAllowed(
  purpose: ListingPurpose,
  from: AvailabilityStatus,
  to: AvailabilityStatus,
): boolean {
  if (from === to) return false;
  return allowedStatuses(purpose).includes(to);
}

/** Only public, visible listings may be seen by visitors. */
export function isPubliclyVisible(p: { visibility: Visibility }): boolean {
  return p.visibility === 'PUBLIC';
}
