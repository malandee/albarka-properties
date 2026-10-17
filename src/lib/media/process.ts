import sharp from 'sharp';
import { ApiError } from '@/lib/http';

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_IMAGES_PER_PROPERTY = 20;
const MIN_SIDE_PX = 480;
const MAX_INPUT_PIXELS = 50_000_000;

export type DetectedType = 'jpeg' | 'png' | 'webp';

/**
 * Identifies the real file type from its leading bytes. Browser-supplied MIME types and
 * filename extensions are ignored, so renamed or executable files are rejected.
 */
export function sniffImageType(buf: Buffer): DetectedType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'webp';
  }
  return null;
}

export interface ProcessedImage {
  large: Buffer; // up to 1600px, WebP
  thumb: Buffer; // up to 640px, WebP
  width: number; // dimensions of the large variant
  height: number;
  sourceType: DetectedType;
}

/**
 * Validates and re-encodes an uploaded image. Re-encoding discards embedded scripts,
 * polyglot payloads, and EXIF metadata such as GPS coordinates.
 */
export async function processImageUpload(buf: Buffer): Promise<ProcessedImage> {
  if (buf.length === 0) throw new ApiError(422, 'EMPTY_FILE', 'The selected file is empty.');
  if (buf.length > MAX_UPLOAD_BYTES) {
    throw new ApiError(413, 'FILE_TOO_LARGE', 'Images must be 8 MB or smaller.');
  }
  const type = sniffImageType(buf);
  if (!type) {
    throw new ApiError(415, 'UNSUPPORTED_TYPE', 'Upload a JPEG, PNG, or WebP image.');
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buf, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' }).metadata();
  } catch {
    throw new ApiError(422, 'INVALID_IMAGE', 'The file could not be read as an image.');
  }
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h || Math.min(w, h) < MIN_SIDE_PX) {
    throw new ApiError(422, 'IMAGE_TOO_SMALL', `Images must be at least ${MIN_SIDE_PX} pixels on the shortest side.`);
  }

  const pipeline = () => sharp(buf, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' }).rotate();
  const large = await pipeline()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await pipeline()
    .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toBuffer();

  return {
    large: large.data,
    thumb,
    width: large.info.width,
    height: large.info.height,
    sourceType: type,
  };
}
