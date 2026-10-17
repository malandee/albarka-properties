import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { removeAdministrator, updateAdministrator } from '@/lib/auth/accounts';
import { adminUpdateSchema } from '@/lib/validation/account';
import { clientIp, errors, ok, readJson, toResponse } from '@/lib/http';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const user = await db.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, createdAt: true, lastLoginAt: true, lastActivityAt: true, _count: { select: { properties: true } } },
    });
    if (!user) throw errors.notFound('Administrator');
    const { _count, ...rest } = user;
    return ok({ ...rest, properties: _count.properties });
  } catch (err) {
    return toResponse(err, 'admin.users.get');
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { actor } = await requireSuperAdmin();
    const { id } = await ctx.params;
    const body = await readJson(req, adminUpdateSchema);
    return ok(await updateAdministrator(actor, id, body, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.users.update');
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { actor } = await requireSuperAdmin();
    const { id } = await ctx.params;
    return ok(await removeAdministrator(actor, id, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.users.remove');
  }
}
