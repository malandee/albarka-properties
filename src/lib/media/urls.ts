/** Public media URL for a stored variant. Access is checked by the /media route. */
export function mediaUrl(storageKey: string, variant: 'lg' | 'sm'): string {
  return `/media/${storageKey}/${variant}`;
}
