import { requireAdmin } from '@/lib/auth/guards';
import { uploadImage } from '@/lib/property/service';
import { errors, ApiError, clientIp, ok, toResponse } from '@/lib/http';
import { MAX_UPLOAD_BYTES } from '@/lib/media/process';

/** multipart/form-data with fields: file (image), altText (text). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { actor } = await requireAdmin();
    const { id } = await ctx.params;
    const declared = Number(req.headers.get('content-length') ?? 0);
    if (declared > MAX_UPLOAD_BYTES + 64 * 1024) throw new ApiError(413, 'FILE_TOO_LARGE', 'Images must be 8 MB or smaller.');
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new ApiError(400, 'INVALID_FORM', 'Send the image as multipart form data.');
    }
    const file = form.get('file');
    const altText = String(form.get('altText') ?? '').trim();
    if (!(file instanceof File)) throw errors.unprocessable('Choose an image to upload.', [{ field: 'file', message: 'Choose an image to upload.' }]);
    if (altText.length < 3 || altText.length > 200) {
      throw errors.unprocessable('Describe the image (3 to 200 characters) for screen readers.', [{ field: 'altText', message: 'Describe the image (3 to 200 characters).' }]);
    }
    if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, 'FILE_TOO_LARGE', 'Images must be 8 MB or smaller.');
    const buf = Buffer.from(await file.arrayBuffer());
    const image = await uploadImage(actor, id, buf, altText, clientIp(req));
    return ok(image, { status: 201 });
  } catch (err) {
    return toResponse(err, 'admin.images.upload');
  }
}
