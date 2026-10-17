import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guards';
import { recordAudit } from '@/lib/audit';
import { profileSchema } from '@/lib/validation/account';
import { clientIp, ok, readJson, toResponse } from '@/lib/http';

export async function GET() {
  try {
    const { actor } = await requireAdmin();
    const user = await db.user.findUniqueOrThrow({ where: { id: actor.id }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, lastLoginAt: true } });
    return ok(user);
  } catch (err) {
    return toResponse(err, 'admin.profile.get');
  }
}

/** Name and phone only. Email, role, and status are changed by a Super Admin, never self-service. */
export async function PATCH(req: Request) {
  try {
    const { actor } = await requireAdmin();
    const body = await readJson(req, profileSchema);
    const user = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: actor.id }, data: { name: body.name, phone: body.phone }, select: { id: true, name: true, phone: true } });
      await recordAudit({ actorId: actor.id, action: 'admin.update', entityType: 'user', entityId: actor.id, summary: 'Updated own profile', ip: clientIp(req) }, tx);
      return updated;
    });
    return ok(user);
  } catch (err) {
    return toResponse(err, 'admin.profile.patch');
  }
}
