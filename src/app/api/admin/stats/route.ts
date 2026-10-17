import { requireAdmin } from '@/lib/auth/guards';
import { dashboardStats } from '@/lib/property/catalogue';
import { ok, toResponse } from '@/lib/http';

export async function GET() {
  try {
    const { actor } = await requireAdmin();
    return ok(await dashboardStats(actor));
  } catch (err) {
    return toResponse(err, 'admin.stats');
  }
}
