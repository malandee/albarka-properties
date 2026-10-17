/** Requirements a listing must meet before the public can see it. Pure function for testing. */
export interface PublishCandidate {
  title: string;
  shortDescription: string;
  description: string;
  addressLine: string;
  city: string;
  state: string;
  priceOnRequest: boolean;
  priceAmount: { toString(): string } | number | null;
  featuredImageCount: number;
}

export function publishBlockers(p: PublishCandidate): string[] {
  const blockers: string[] = [];
  if (!p.title.trim()) blockers.push('A title is required.');
  if (!p.shortDescription.trim()) blockers.push('A short description is required.');
  if (!p.description.trim()) blockers.push('A full description is required.');
  if (!p.addressLine.trim() || !p.city.trim() || !p.state.trim()) blockers.push('A complete address is required.');
  if (!p.priceOnRequest && (p.priceAmount === null || p.priceAmount === undefined)) {
    blockers.push('A price or "Price on request" is required.');
  }
  if (p.featuredImageCount < 1) blockers.push('Add at least one image and choose a featured image.');
  return blockers;
}
