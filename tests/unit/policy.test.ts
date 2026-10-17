import { describe, expect, it } from 'vitest';
import {
  PERMISSIONS,
  canDeleteProperty,
  canDeactivateAdministrator,
  canRemoveAdministrator,
  isStatusTransitionAllowed,
  isPubliclyVisible,
  allowedStatuses,
  type Actor,
} from '@/lib/auth/policy';

const superAdmin: Actor = { id: 'sa1', role: 'SUPER_ADMIN', status: 'ACTIVE' };
const admin: Actor = { id: 'ad1', role: 'ADMIN', status: 'ACTIVE' };
const inactiveAdmin: Actor = { id: 'ad2', role: 'ADMIN', status: 'INACTIVE' };

describe('ownership', () => {
  it('lets an administrator view and manage only their own listings', () => {
    expect(PERMISSIONS.viewProperty(admin, { ownerId: 'ad1' })).toBe(true);
    expect(PERMISSIONS.viewProperty(admin, { ownerId: 'other' })).toBe(false);
    expect(PERMISSIONS.manageProperty(admin, { ownerId: 'other' })).toBe(false);
  });

  it('lets a Super Admin manage any listing', () => {
    expect(PERMISSIONS.manageProperty(superAdmin, { ownerId: 'other' })).toBe(true);
  });

  it('denies everyone when the account is inactive', () => {
    expect(PERMISSIONS.viewProperty(inactiveAdmin, { ownerId: 'ad2' })).toBe(false);
    expect(PERMISSIONS.manageAdministrators(inactiveAdmin)).toBe(false);
  });

  it('never allows changing a role through the application', () => {
    expect(PERMISSIONS.changeRole(superAdmin)).toBe(false);
  });
});

describe('deletion', () => {
  it('blocks deleting a public listing', () => {
    expect(canDeleteProperty(admin, { ownerId: 'ad1', visibility: 'PUBLIC' }).allowed).toBe(false);
  });

  it('allows deleting a hidden listing the actor owns', () => {
    expect(canDeleteProperty(admin, { ownerId: 'ad1', visibility: 'HIDDEN' }).allowed).toBe(true);
  });

  it('blocks an administrator deleting another administrator’s hidden listing', () => {
    expect(canDeleteProperty(admin, { ownerId: 'other', visibility: 'HIDDEN' }).allowed).toBe(false);
  });
});

describe('administrator lifecycle', () => {
  const lastSuper = { id: 'sa1', role: 'SUPER_ADMIN' as const, status: 'ACTIVE' as const };

  it('blocks removing the last active Super Admin', () => {
    const r = canRemoveAdministrator({ actorId: 'sa2', target: lastSuper, activeSuperAdminCount: 1, ownedPropertyCount: 0 });
    expect(r.allowed).toBe(false);
  });

  it('blocks deactivating the last active Super Admin', () => {
    expect(canDeactivateAdministrator({ actorId: 'sa2', target: lastSuper, activeSuperAdminCount: 1 }).allowed).toBe(false);
  });

  it('blocks removing an account that still owns listings', () => {
    const r = canRemoveAdministrator({ actorId: 'sa1', target: { id: 'ad1', role: 'ADMIN', status: 'ACTIVE' }, activeSuperAdminCount: 1, ownedPropertyCount: 2 });
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/still owns 2 properties/);
  });

  it('blocks removing your own account', () => {
    expect(canRemoveAdministrator({ actorId: 'ad1', target: { id: 'ad1', role: 'ADMIN', status: 'ACTIVE' }, activeSuperAdminCount: 2, ownedPropertyCount: 0 }).allowed).toBe(false);
  });

  it('allows removing an administrator with no listings', () => {
    expect(canRemoveAdministrator({ actorId: 'sa1', target: { id: 'ad1', role: 'ADMIN', status: 'INACTIVE' }, activeSuperAdminCount: 1, ownedPropertyCount: 0 }).allowed).toBe(true);
  });
});

describe('availability status', () => {
  it('uses Sold for sale listings and Rented for rental listings', () => {
    expect(allowedStatuses('FOR_SALE')).toEqual(['AVAILABLE', 'RESERVED', 'SOLD']);
    expect(allowedStatuses('FOR_RENT')).toEqual(['AVAILABLE', 'RESERVED', 'RENTED']);
  });

  it('rejects a Sold status on a rental listing', () => {
    expect(isStatusTransitionAllowed('FOR_RENT', 'AVAILABLE', 'SOLD')).toBe(false);
  });

  it('rejects a no-op transition', () => {
    expect(isStatusTransitionAllowed('FOR_SALE', 'SOLD', 'SOLD')).toBe(false);
  });

  it('allows returning a sold listing to available', () => {
    expect(isStatusTransitionAllowed('FOR_SALE', 'SOLD', 'AVAILABLE')).toBe(true);
  });

  it('only public listings are visible to visitors', () => {
    expect(isPubliclyVisible({ visibility: 'PUBLIC' })).toBe(true);
    expect(isPubliclyVisible({ visibility: 'HIDDEN' })).toBe(false);
  });
});
