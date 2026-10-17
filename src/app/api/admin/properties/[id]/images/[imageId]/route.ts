import { requireAdmin } from '@/lib/auth/guards';
import { ApiError, clientIp, errors, ok, readJson, toResponse } from '@/lib/http';
import { imageUpdateSchema } from '@/lib/validation/property';
import { MAX_UPLOAD_BYTES } from '@/lib/media/process';
import { removeImage, replaceImage, setFeaturedImage, updateImageAlt } from '@/lib/property/service';

type Ctx = { params: Promise<{ id: string; imageId: string }> };

/** Update alt text and/or set as featured. */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { actor } = await requireAdmin();
    const { id, imageId } = await ctx.params;
    const body = await readJson(req, imageUpdateSchema);
    if (body.altText !== undefined) await updateImageAlt(actor, id, imageId, body.altText, clientIp(req));
    if (body.isFeatured) await setFeaturedImage(actor, id, imageId, clientIp(req));
    return ok({ id: imageId });
  } catch (err) {
    return toResponse(err, 'admin.images.update');
  }
}

/** Replace the file of an existing image (multipart, field "file"). */
export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { actor } = await requireAdmin();
    const { id, imageId } = await ctx.params;
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new ApiError(400, 'INVALID_FORM', 'Send the image as multipart form data.');
    }
    const file = form.get('file');
    if (!(file instanceof File)) throw errors.unprocessable('Choose an image to upload.', [{ field: 'file', message: 'Choose an image to upload.' }]);
    if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, 'FILE_TOO_LARGE', 'Images must be 8 MB or smaller.');
    return ok(await replaceImage(actor, id, imageId, Buffer.from(await file.arrayBuffer()), clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.images.replace');
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { actor } = await requireAdmin();
    const { id, imageId } = await ctx.params;
    return ok(await removeImage(actor, id, imageId, clientIp(req)));
  } catch (err) {
    return toResponse(err, 'admin.images.delete');
  }
}
