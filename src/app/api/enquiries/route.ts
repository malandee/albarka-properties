import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { consumeRateLimit } from '@/lib/security/rate-limit';
import { hashIp } from '@/lib/security/crypto';
import { contactEnquirySchema, SUBJECT_LABELS } from '@/lib/validation/account';
import { ApiError, clientIp, errors, ok, readJson, toResponse } from '@/lib/http';

/**
 * Public contact enquiry. A row is stored only after a successful insert; the response
 * says "received" only in that case. No email is sent by this endpoint.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const perIp = await consumeRateLimit(`enquiry:ip:${ip ?? 'unknown'}`, 5, 60 * 60);
    if (!perIp.allowed) throw errors.rateLimited(perIp.retryAfterSeconds);

    const body = await readJson(req, contactEnquirySchema);
    // Honeypot: silently accept bot submissions without storing them.
    if (body.website && body.website.trim() !== '') {
      return ok({ received: true, reference: null });
    }

    let propertyId: string | null = null;
    let propertyRef: string | null = null;
    if (body.propertySlug) {
      const p = await db.property.findFirst({ where: { slug: body.propertySlug, visibility: 'PUBLIC' }, select: { id: true, title: true } });
      if (!p) throw errors.unprocessable('The property you are asking about is no longer available to enquire about.', [{ field: 'propertySlug', message: 'Property not found.' }]);
      propertyId = p.id;
      propertyRef = p.title.slice(0, 160);
    }

    const created = await db.contactEnquiry.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        subject: SUBJECT_LABELS[body.subject] ?? 'General enquiry',
        message: body.message,
        propertyId,
        propertyRef,
        ipHash: hashIp(ip),
      },
      select: { id: true, createdAt: true },
    });
    const reference = createHash('sha256').update(created.id).digest('hex').slice(0, 8).toUpperCase();
    return ok({ received: true, reference }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return toResponse(err, 'public.enquiry');
    return toResponse(err, 'public.enquiry');
  }
}
