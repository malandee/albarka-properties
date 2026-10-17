import type { Prisma, PrismaClient } from '@prisma/client';
import { db } from './db';
import { hashIp } from './security/crypto';

type Tx = PrismaClient | Prisma.TransactionClient;

export type AuditAction =
  | 'admin.create'
  | 'admin.update'
  | 'admin.activate'
  | 'admin.deactivate'
  | 'admin.reset_credentials'
  | 'admin.remove'
  | 'admin.password_changed'
  | 'auth.login'
  | 'property.create'
  | 'property.update'
  | 'property.status'
  | 'property.publish'
  | 'property.hide'
  | 'property.delete'
  | 'property.image_upload'
  | 'property.image_replace'
  | 'property.image_remove'
  | 'property.image_feature'
  | 'property.image_reorder'
  | 'catalogue.create'
  | 'catalogue.update'
  | 'settings.update'
  | 'enquiry.status';

/**
 * Appends an audit record. Summaries must never contain passwords, tokens, or other
 * secrets. Pass the transaction client when the audited change happens inside a transaction,
 * so the log and the change commit or roll back together.
 */
export async function recordAudit(
  input: {
    actorId: string | null;
    action: AuditAction;
    entityType: string;
    entityId?: string | null;
    summary: string;
    ip?: string | null;
  },
  client: Tx = db,
): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary.slice(0, 300),
      ipHash: hashIp(input.ip ?? null),
    },
  });
}
