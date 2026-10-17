'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { apiRequest, ApiClientError } from '@/lib/client/api';
import { checkImageFile, uploadForm } from '@/lib/client/upload';
import { mediaUrl } from '@/lib/media/urls';

export interface ManagedImage {
  id: string;
  storageKey: string;
  altText: string;
  isFeatured: boolean;
  sortOrder: number;
  width: number;
  height: number;
}

interface Props {
  propertyId: string;
  images: ManagedImage[];
  maxImages: number;
}

/**
 * Gallery management: upload with progress and preview, edit descriptions, set the featured image,
 * reorder with buttons (keyboard-friendly), replace a file, and remove an image after confirmation.
 */
export function GalleryManager({ propertyId, images, maxImages }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState('');
  const [pendingRemove, setPendingRemove] = useState<ManagedImage | null>(null);
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const atLimit = images.length >= maxImages;

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
    const problem = checkImageFile(file);
    if (problem) {
      setUploadError(problem);
      return;
    }
    if (alt.trim().length < 3) {
      setUploadError('Describe the photograph in a few words (at least 3 characters).');
      return;
    }
    setUploadError(null);
    setBusy('upload');
    setProgress(0);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('altText', alt.trim());
      await uploadForm(`/api/admin/properties/${propertyId}/images`, 'POST', form, setProgress);
      toast.success('Photograph added to the gallery.');
      setFile(null);
      setAlt('');
      if (fileInput.current) fileInput.current.value = '';
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'The photograph could not be added.';
      setUploadError(message);
      toast.error(message);
    } finally {
      setBusy(null);
      setProgress(null);
    }
  }

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
      toast.success(success);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'That change could not be saved.');
    } finally {
      setBusy(null);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const ids = images.map((i) => i.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await run(`move-${index}`, () => apiRequest(`/api/admin/properties/${propertyId}/images/order`, { method: 'PUT', body: { imageIds: ids } }), 'Gallery order updated.');
  }

  async function replaceImage(img: ManagedImage, f: File) {
    const problem = checkImageFile(f);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(`replace-${img.id}`);
    setProgress(0);
    try {
      const form = new FormData();
      form.append('file', f);
      await uploadForm(`/api/admin/properties/${propertyId}/images/${img.id}`, 'PUT', form, setProgress);
      toast.success('Photograph replaced.');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'The photograph could not be replaced.');
    } finally {
      setBusy(null);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="upload-heading" className="card p-5 md:p-6">
        <h2 id="upload-heading" className="text-card text-brand-ink">
          Add a photograph
        </h2>
        <p className="mt-1 text-support text-neutral-muted">
          JPEG, PNG, or WebP up to 8 MB, at least 480 pixels on the shortest side. {images.length} of {maxImages} used.
        </p>
        {atLimit ? (
          <p role="status" className="mt-4 text-support text-neutral-text">This listing has reached the limit of {maxImages} photographs. Remove one to add another.</p>
        ) : (
          <form onSubmit={onUpload} className="mt-5 grid gap-5 md:grid-cols-[1fr_1fr]" noValidate>
            <div>
              <label htmlFor="gallery-file" className="block text-support font-semibold text-brand-ink">
                Photograph
              </label>
              <input id="gallery-file" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setUploadError(null); }} disabled={!!busy} className="mt-1.5 block w-full text-support file:mr-4 file:min-h-11 file:rounded-md file:border-0 file:bg-neutral-alt file:px-4 file:font-semibold file:text-brand-ink" />
              {preview && (
                <img src={preview} alt="Preview of the selected photograph" className="mt-3 aspect-[4/3] w-full max-w-xs rounded-md object-cover" />
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="gallery-alt" className="block text-support font-semibold text-brand-ink">
                  Description for screen readers
                </label>
                <input id="gallery-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={200} className="mt-1.5 input" placeholder="e.g. Living room with grey sofa and large window" aria-describedby="gallery-alt-help" />
                <p id="gallery-alt-help" className="mt-1.5 text-[0.8125rem] text-neutral-muted">Describe what the photograph shows. Do not include prices or phone numbers.</p>
              </div>
              {progress !== null && (
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-alt" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                    <div className="h-full bg-brand-deep transition-[width] duration-200 ease-std" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1 text-[0.8125rem] text-neutral-muted">Uploading… {progress}%</p>
                </div>
              )}
              {uploadError && (
                <p role="alert" className="text-support text-danger">
                  {uploadError}
                </p>
              )}
              <Button type="submit" loading={busy === 'upload'} loadingLabel="Uploading…" disabled={!file}>
                Add to gallery
              </Button>
            </div>
          </form>
        )}
      </section>

      <section aria-labelledby="gallery-heading" className="space-y-4">
        <h2 id="gallery-heading" className="text-card text-brand-ink">
          Photographs ({images.length})
        </h2>
        {images.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-border bg-white p-8 text-center text-support text-neutral-muted">
            No photographs yet. A listing needs one featured photograph before it can be shown publicly.
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {images.map((img, index) => (
              <li key={img.id} className="card flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] bg-neutral-alt">
                  <img src={mediaUrl(img.storageKey, 'sm')} alt={img.altText} loading="lazy" decoding="async" width={640} height={480} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3 flex gap-2">
                    {img.isFeatured && <span className="rounded-md bg-brand-deep px-2.5 py-1 text-[0.8125rem] font-semibold text-white">Featured</span>}
                    <span className="rounded-md bg-white/95 px-2.5 py-1 text-[0.8125rem] font-semibold text-brand-ink">Position {index + 1}</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div>
                    <label htmlFor={`alt-${img.id}`} className="block text-support font-semibold text-brand-ink">
                      Description
                    </label>
                    <div className="mt-1.5 flex gap-2">
                      <input id={`alt-${img.id}`} value={altDrafts[img.id] ?? img.altText} onChange={(e) => setAltDrafts((d) => ({ ...d, [img.id]: e.target.value }))} maxLength={200} className="input min-h-10" />
                      <Button variant="secondary" className="min-h-10 px-3" loading={busy === `alt-${img.id}`} loadingLabel="Saving" disabled={(altDrafts[img.id] ?? img.altText) === img.altText || (altDrafts[img.id] ?? '').trim().length < 3}
                        onClick={() => run(`alt-${img.id}`, () => apiRequest(`/api/admin/properties/${propertyId}/images/${img.id}`, { method: 'PATCH', body: { altText: (altDrafts[img.id] ?? '').trim() } }), 'Description saved.')}>
                        Save
                      </Button>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {!img.isFeatured && (
                      <Button variant="secondary" className="min-h-10 px-3" loading={busy === `feature-${img.id}`} loadingLabel="Saving" onClick={() => run(`feature-${img.id}`, () => apiRequest(`/api/admin/properties/${propertyId}/images/${img.id}`, { method: 'PATCH', body: { isFeatured: true } }), 'Featured photograph updated.')}>
                        Make featured
                      </Button>
                    )}
                    <Button variant="ghost" className="min-h-10 px-3" disabled={index === 0 || !!busy} onClick={() => move(index, -1)}>
                      Move up<span className="sr-only"> photo {index + 1}</span>
                    </Button>
                    <Button variant="ghost" className="min-h-10 px-3" disabled={index === images.length - 1 || !!busy} onClick={() => move(index, 1)}>
                      Move down<span className="sr-only"> photo {index + 1}</span>
                    </Button>
                    <label className="btn-ghost min-h-10 cursor-pointer px-3">
                      Replace file
                      <span className="sr-only"> for photo {index + 1}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void replaceImage(img, f); e.target.value = ''; }} />
                    </label>
                    <Button variant="danger" className="min-h-10 px-3" disabled={!!busy} onClick={() => setPendingRemove(img)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={!!pendingRemove}
        title="Remove this photograph?"
        description="The photograph will be removed from this listing and deleted from storage. This cannot be undone."
        confirmLabel="Remove photograph"
        destructive
        busy={busy === `remove-${pendingRemove?.id}`}
        onCancel={() => setPendingRemove(null)}
        onConfirm={async () => {
          if (!pendingRemove) return;
          const id = pendingRemove.id;
          setBusy(`remove-${id}`);
          try {
            await apiRequest(`/api/admin/properties/${propertyId}/images/${id}`, { method: 'DELETE' });
            toast.success('Photograph removed.');
            setPendingRemove(null);
            router.refresh();
          } catch (err) {
            toast.error(err instanceof ApiClientError ? err.message : 'The photograph could not be removed.');
          } finally {
            setBusy(null);
          }
        }}
      />
      {progress !== null && busy?.startsWith('replace') && <p className="sr-only" role="status">Replacing photograph, {progress}%</p>}
    </div>
  );
}
