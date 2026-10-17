import { ApiClientError, type FieldIssue } from './api';

/** Multipart upload with progress reporting (fetch cannot report upload progress). */
export function uploadForm<T>(
  url: string,
  method: 'POST' | 'PUT',
  form: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.responseType = 'text';
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiClientError('The upload could not be completed. Check your connection and try again.', 0, 'NETWORK'));
    xhr.onload = () => {
      let json: { ok?: boolean; data?: T; error?: { code: string; message: string; details?: FieldIssue[] | null } } | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && json?.ok) {
        onProgress?.(100);
        resolve(json.data as T);
      } else {
        reject(new ApiClientError(json?.error?.message ?? 'The image could not be uploaded.', xhr.status, json?.error?.code ?? 'ERROR', json?.error?.details ?? []));
      }
    };
    xhr.send(form);
  });
}

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Quick client-side check. The server repeats these checks and inspects the file contents. */
export function checkImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Upload a JPEG, PNG, or WebP image.';
  if (file.size > MAX_IMAGE_BYTES) return 'Images must be 8 MB or smaller.';
  if (file.size === 0) return 'The selected file is empty.';
  return null;
}
