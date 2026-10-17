import { z } from 'zod';
import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { recordAudit } from '@/lib/audit';
import { clientIp, errors, ok, readJson, toResponse } from '@/lib/http';

const schema = z.object({ status: z.enum(['NEW', 'REVIEWED', 'CLOSED']) }).strict();

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { actor } = await requireSuperAdmin();
    const { id } = await ctx.params;
    const body = await readJson(req, schema);
    const found = await db.contactEnquiry.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw errors.notFound('Enquiry');
    await db.$transaction(async (tx) => {
      await tx.contactEnquiry.update({ where: { id }, data: { status: body.status } });
      await recordAudit({ actorId: actor.id, action: 'enquiry.status', entityType: 'enquiry', entityId: id, summary: `Enquiry marked ${body.status.toLowerCase()}`, ip: clientIp(req) }, tx);
    });
    return ok({ id, status: body.status });
  } catch (err) {
    return toResponse(err, 'admin.enquiries.status');
  }
}
