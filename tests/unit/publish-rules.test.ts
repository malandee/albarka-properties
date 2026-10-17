import { describe, expect, it } from 'vitest';
import { publishBlockers } from '@/lib/property/publish-rules';

const complete = {
  title: 'Four-bedroom house',
  shortDescription: 'A spacious family home.',
  description: 'A detached house with four bedrooms and a secure compound.',
  addressLine: 'Bompai Road',
  city: 'Kano',
  state: 'Kano',
  priceOnRequest: false,
  priceAmount: '185000000',
  featuredImageCount: 1,
};

describe('publishBlockers', () => {
  it('returns no blockers for a complete listing with a featured image', () => {
    expect(publishBlockers(complete)).toEqual([]);
  });

  it('requires a featured image before a listing can be shown', () => {
    expect(publishBlockers({ ...complete, featuredImageCount: 0 })).toEqual(['Add at least one image and choose a featured image.']);
  });

  it('requires a price unless price on request is chosen', () => {
    expect(publishBlockers({ ...complete, priceAmount: null })).toHaveLength(1);
    expect(publishBlockers({ ...complete, priceAmount: null, priceOnRequest: true })).toEqual([]);
  });

  it('reports every missing item together', () => {
    expect(publishBlockers({ ...complete, title: '  ', city: '', featuredImageCount: 0 }).length).toBe(3);
  });
});
