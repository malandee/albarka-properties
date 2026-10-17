'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { NIGERIAN_STATES } from '@/config/nigeria';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiRequest, ApiClientError, fieldErrorMap } from '@/lib/client/api';
import { MapPicker } from './MapPicker';

export interface PropertyFormValues {
  title: string;
  shortDescription: string;
  description: string;
  purpose: '' | 'FOR_SALE' | 'FOR_RENT';
  categoryId: string;
  priceAmount: string;
  priceOnRequest: boolean;
  currency: 'NGN' | 'USD';
  priceNote: string;
  addressLine: string;
  area: string;
  city: string;
  state: string;
  formattedAddress: string;
  latitude: string;
  longitude: string;
  mapIsPrivate: boolean;
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  parkingSpaces: string;
  floors: string;
  landSizeSqm: string;
  buildingSizeSqm: string;
  featureIds: string[];
}

export const EMPTY_VALUES: PropertyFormValues = {
  title: '',
  shortDescription: '',
  description: '',
  purpose: '',
  categoryId: '',
  priceAmount: '',
  priceOnRequest: false,
  currency: 'NGN',
  priceNote: '',
  addressLine: '',
  area: '',
  city: '',
  state: '',
  formattedAddress: '',
  latitude: '',
  longitude: '',
  mapIsPrivate: false,
  bedrooms: '',
  bathrooms: '',
  toilets: '',
  parkingSpaces: '',
  floors: '',
  landSizeSqm: '',
  buildingSizeSqm: '',
  featureIds: [],
};

interface Props {
  mode: 'create' | 'edit';
  propertyId?: string;
  initial: PropertyFormValues;
  categories: { id: string; name: string }[];
  features: { id: string; label: string }[];
  canMarkPrivate?: boolean;
}

const LABEL = 'block text-support font-semibold text-brand-ink';
const REQ = <span aria-hidden="true" className="text-danger"> *</span>;

/**
 * Property create/edit form.
 * - Client checks give quick feedback; the server re-validates everything and its field messages are shown inline.
 * - Entered values are kept when a submission fails.
 * - Submit is disabled while saving, which prevents duplicate submissions.
 * - Unsaved changes trigger a browser warning before leaving the page.
 */
export function PropertyForm({ mode, propertyId, initial, categories, features }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<PropertyFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const shortCount = values.shortDescription.length;
  const featureSet = useMemo(() => new Set(values.featureIds), [values.featureIds]);

  function set<K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: '' }));
  }

  function validateLocal(): Record<string, string> {
    const e: Record<string, string> = {};
    if (values.title.trim().length < 5) e.title = 'Enter a title of at least 5 characters.';
    if (!values.purpose) e.purpose = 'Choose For Sale or For Rent.';
    if (!values.categoryId) e.categoryId = 'Choose a property type.';
    if (values.shortDescription.trim().length < 20) e.shortDescription = 'Write a short description of at least 20 characters.';
    if (values.description.trim().length < 40) e.description = 'Write a full description of at least 40 characters.';
    if (!values.priceOnRequest && values.priceAmount.trim() === '') e.priceAmount = 'Enter a price, or choose "Price on request".';
    if (values.priceOnRequest && values.priceAmount.trim() !== '') e.priceAmount = 'Remove the amount, or turn off "Price on request".';
    if (values.addressLine.trim().length < 5) e.addressLine = 'Enter the street address or landmark.';
    if (values.city.trim().length < 2) e.city = 'Enter the city or town.';
    if (!values.state) e.state = 'Choose a state.';
    const hasLat = values.latitude.trim() !== '';
    const hasLng = values.longitude.trim() !== '';
    if (hasLat !== hasLng) e.longitude = 'Latitude and longitude must be provided together.';
    if (hasLat && (!Number.isFinite(Number(values.latitude)) || Number(values.latitude) < -90 || Number(values.latitude) > 90)) e.latitude = 'Latitude must be between -90 and 90.';
    if (hasLng && (!Number.isFinite(Number(values.longitude)) || Number(values.longitude) < -180 || Number(values.longitude) > 180)) e.longitude = 'Longitude must be between -180 and 180.';
    return e;
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (busy) return;
    setFormError(null);
    const local = validateLocal();
    setErrors(local);
    if (Object.keys(local).length) {
      const firstKey = Object.keys(local)[0]!;
      document.getElementById(`field-${firstKey}`)?.focus();
      setFormError('Please correct the highlighted fields.');
      return;
    }
    const payload = {
      ...values,
      priceAmount: values.priceOnRequest ? null : values.priceAmount,
      categoryId: values.categoryId,
    };
    setBusy(true);
    try {
      if (mode === 'create') {
        const created = await apiRequest<{ id: string }>('/api/admin/properties', { method: 'POST', body: payload });
        setDirty(false);
        toast.success('Listing saved as hidden. Add photographs and preview it before showing it publicly.');
        router.push(`/admin/properties/${created.id}/edit?created=1`);
      } else {
        await apiRequest(`/api/admin/properties/${propertyId}`, { method: 'PATCH', body: payload });
        setDirty(false);
        toast.success('Listing changes saved.');
        router.refresh();
      }
    } catch (err) {
      const fields = fieldErrorMap(err);
      if (Object.keys(fields).length) setErrors(fields);
      const message = err instanceof ApiClientError ? err.message : 'The listing could not be saved. Your entries are still here. Please try again.';
      setFormError(message);
      toast.error(message);
      const firstKey = Object.keys(fields)[0];
      if (firstKey) document.getElementById(`field-${firstKey}`)?.focus();
    } finally {
      setBusy(false);
    }
  }

  const input = (k: string) => `mt-1.5 input ${errors[k] ? 'input-invalid' : ''}`;
  const aria = (k: string) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `field-${k}-error` : undefined });
  const err = (k: string) => (errors[k] ? <p id={`field-${k}-error`} className="mt-1.5 text-[0.8125rem] text-danger">{errors[k]}</p> : null);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8" aria-label={mode === 'create' ? 'New property listing' : 'Edit property listing'}>
      <p className="text-support text-neutral-muted">
        Fields marked <span aria-hidden="true" className="text-danger">*</span><span className="sr-only">with an asterisk</span> are required. New listings are saved as hidden until you choose to show them.
      </p>

      {formError && (
        <div role="alert" className="rounded-md border border-danger/30 bg-white p-4 text-support text-danger">
          {formError}
        </div>
      )}

      <fieldset className="card space-y-6 p-5 md:p-6">
        <legend className="px-1 text-card text-brand-ink">Listing details</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <span className={LABEL} id="purpose-label">
              Listing purpose{REQ}
            </span>
            <div role="radiogroup" aria-labelledby="purpose-label" className="mt-1.5 grid grid-cols-2 gap-2" id="field-purpose">
              {(['FOR_SALE', 'FOR_RENT'] as const).map((p) => (
                <label key={p} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-3 text-support font-semibold ${values.purpose === p ? 'border-brand-deep bg-brand-deep text-white' : 'border-neutral-border bg-white text-brand-ink hover:border-brand-deep'}`}>
                  <input type="radio" name="purpose" value={p} checked={values.purpose === p} onChange={() => set('purpose', p)} className="sr-only" />
                  {p === 'FOR_SALE' ? 'For Sale' : 'For Rent'}
                </label>
              ))}
            </div>
            {err('purpose')}
          </div>
          <div>
            <label htmlFor="field-categoryId" className={LABEL}>
              Property type{REQ}
            </label>
            <select id="field-categoryId" name="categoryId" value={values.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={input('categoryId')} {...aria('categoryId')}>
              <option value="">Choose a type</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {err('categoryId')}
          </div>
        </div>

        <div>
          <label htmlFor="field-title" className={LABEL}>
            Property title{REQ}
          </label>
          <input id="field-title" name="title" value={values.title} onChange={(e) => set('title', e.target.value)} maxLength={160} className={input('title')} {...aria('title')} />
          <p className="mt-1.5 text-[0.8125rem] text-neutral-muted">Example: “Four-bedroom detached house with boys’ quarters”.</p>
          {err('title')}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="field-shortDescription" className={LABEL}>
              Short description{REQ}
            </label>
            <span className="text-[0.8125rem] text-neutral-muted" aria-live="off">{shortCount}/280</span>
          </div>
          <textarea id="field-shortDescription" name="shortDescription" rows={2} value={values.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} maxLength={280} className={`${input('shortDescription')} resize-y`} {...aria('shortDescription')} />
          <p className="mt-1.5 text-[0.8125rem] text-neutral-muted">Shown on cards and in search results.</p>
          {err('shortDescription')}
        </div>

        <div>
          <label htmlFor="field-description" className={LABEL}>
            Full description{REQ}
          </label>
          <textarea id="field-description" name="description" rows={8} value={values.description} onChange={(e) => set('description', e.target.value)} maxLength={8000} className={`${input('description')} min-h-48 resize-y`} {...aria('description')} />
          {err('description')}
        </div>
      </fieldset>

      <fieldset className="card space-y-6 p-5 md:p-6">
        <legend className="px-1 text-card text-brand-ink">Price</legend>
        <div className="grid gap-5 md:grid-cols-[1fr_140px_1fr]">
          <div>
            <label htmlFor="field-priceAmount" className={LABEL}>
              Amount{REQ}
            </label>
            <input id="field-priceAmount" name="priceAmount" type="number" inputMode="decimal" min={0} step="0.01" value={values.priceAmount} disabled={values.priceOnRequest} onChange={(e) => set('priceAmount', e.target.value)} className={input('priceAmount')} {...aria('priceAmount')} />
            {err('priceAmount')}
          </div>
          <div>
            <label htmlFor="field-currency" className={LABEL}>
              Currency
            </label>
            <select id="field-currency" name="currency" value={values.currency} onChange={(e) => set('currency', e.target.value as 'NGN' | 'USD')} className={input('currency')}>
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label htmlFor="field-priceNote" className={LABEL}>
              Pricing note (optional)
            </label>
            <input id="field-priceNote" name="priceNote" value={values.priceNote} onChange={(e) => set('priceNote', e.target.value)} maxLength={160} placeholder="e.g. per year, negotiable" className={input('priceNote')} {...aria('priceNote')} />
            {err('priceNote')}
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-support text-neutral-text">
          <input type="checkbox" checked={values.priceOnRequest} onChange={(e) => { set('priceOnRequest', e.target.checked); if (e.target.checked) set('priceAmount', ''); }} className="h-5 w-5 rounded border-neutral-border accent-brand-deep" />
          Price on request (visitors will see “Contact for price”)
        </label>
        {err('priceOnRequest')}
      </fieldset>

      <fieldset className="card space-y-6 p-5 md:p-6">
        <legend className="px-1 text-card text-brand-ink">Address and area</legend>
        <div>
          <label htmlFor="field-addressLine" className={LABEL}>
            Street address or landmark{REQ}
          </label>
          <input id="field-addressLine" name="addressLine" value={values.addressLine} onChange={(e) => set('addressLine', e.target.value)} maxLength={255} className={input('addressLine')} {...aria('addressLine')} />
          {err('addressLine')}
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label htmlFor="field-area" className={LABEL}>
              Area or neighbourhood
            </label>
            <input id="field-area" name="area" value={values.area} onChange={(e) => set('area', e.target.value)} maxLength={120} className={input('area')} {...aria('area')} />
            {err('area')}
          </div>
          <div>
            <label htmlFor="field-city" className={LABEL}>
              City or town{REQ}
            </label>
            <input id="field-city" name="city" value={values.city} onChange={(e) => set('city', e.target.value)} maxLength={120} className={input('city')} {...aria('city')} />
            {err('city')}
          </div>
          <div>
            <label htmlFor="field-state" className={LABEL}>
              State{REQ}
            </label>
            <select id="field-state" name="state" value={values.state} onChange={(e) => set('state', e.target.value)} className={input('state')} {...aria('state')}>
              <option value="">Choose a state</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {err('state')}
          </div>
        </div>
        <div>
          <label htmlFor="field-formattedAddress" className={LABEL}>
            Formatted address (from the map)
          </label>
          <input id="field-formattedAddress" name="formattedAddress" value={values.formattedAddress} onChange={(e) => set('formattedAddress', e.target.value)} maxLength={400} className={input('formattedAddress')} {...aria('formattedAddress')} />
          <p className="mt-1.5 text-[0.8125rem] text-neutral-muted">Filled in when you choose a place on the map. You can edit it.</p>
          {err('formattedAddress')}
        </div>
        <label className="flex min-h-11 items-start gap-3 text-support text-neutral-text">
          <input type="checkbox" checked={values.mapIsPrivate} onChange={(e) => set('mapIsPrivate', e.target.checked)} className="mt-1 h-5 w-5 rounded border-neutral-border accent-brand-deep" />
          <span>
            Keep the exact map location private. The public page will show the area and address, but not the map or directions.
          </span>
        </label>
        <MapPicker
          latitude={values.latitude}
          longitude={values.longitude}
          disabled={busy}
          errorLatitude={errors.latitude}
          errorLongitude={errors.longitude}
          onChange={(next) => {
            setValues((v) => ({ ...v, latitude: next.latitude, longitude: next.longitude, ...(next.formattedAddress !== undefined ? { formattedAddress: next.formattedAddress } : {}) }));
            setDirty(true);
            setErrors((e) => ({ ...e, latitude: '', longitude: '' }));
          }}
        />
      </fieldset>

      <fieldset className="card space-y-6 p-5 md:p-6">
        <legend className="px-1 text-card text-brand-ink">Specifications</legend>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ['bedrooms', 'Bedrooms'],
            ['bathrooms', 'Bathrooms'],
            ['toilets', 'Toilets'],
            ['parkingSpaces', 'Parking spaces'],
            ['floors', 'Floors'],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <label htmlFor={`field-${k}`} className={LABEL}>
                {label}
              </label>
              <input id={`field-${k}`} name={k} type="number" inputMode="numeric" min={0} step={1} value={values[k]} onChange={(e) => set(k, e.target.value)} className={input(k)} {...aria(k)} />
              {err(k)}
            </div>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="field-landSizeSqm" className={LABEL}>
              Land size (square metres)
            </label>
            <input id="field-landSizeSqm" name="landSizeSqm" type="number" inputMode="decimal" min={0} step="0.01" value={values.landSizeSqm} onChange={(e) => set('landSizeSqm', e.target.value)} className={input('landSizeSqm')} {...aria('landSizeSqm')} />
            {err('landSizeSqm')}
          </div>
          <div>
            <label htmlFor="field-buildingSizeSqm" className={LABEL}>
              Building size (square metres)
            </label>
            <input id="field-buildingSizeSqm" name="buildingSizeSqm" type="number" inputMode="decimal" min={0} step="0.01" value={values.buildingSizeSqm} onChange={(e) => set('buildingSizeSqm', e.target.value)} className={input('buildingSizeSqm')} {...aria('buildingSizeSqm')} />
            {err('buildingSizeSqm')}
          </div>
        </div>
      </fieldset>

      <fieldset className="card space-y-4 p-5 md:p-6">
        <legend className="px-1 text-card text-brand-ink">Features and amenities</legend>
        {features.length === 0 ? (
          <p className="text-support text-neutral-muted">No features are configured yet. A Super Admin can add them under Settings.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <label key={f.id} className="flex min-h-11 items-center gap-3 rounded-md border border-neutral-border bg-white px-3 text-support text-neutral-text hover:border-brand-deep">
                <input
                  type="checkbox"
                  checked={featureSet.has(f.id)}
                  onChange={(e) => set('featureIds', e.target.checked ? [...values.featureIds, f.id] : values.featureIds.filter((x) => x !== f.id))}
                  className="h-5 w-5 rounded border-neutral-border accent-brand-deep"
                />
                {f.label}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="sticky bottom-0 -mx-5 flex flex-col gap-3 border-t border-neutral-border bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:-mx-8 md:px-8">
        <p className="text-[0.8125rem] text-neutral-muted" aria-live="polite">{dirty ? 'You have unsaved changes.' : mode === 'create' ? 'Nothing is shown publicly until you choose Show.' : 'All changes saved.'}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => router.back()} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" loading={busy} loadingLabel={mode === 'create' ? 'Saving listing…' : 'Saving changes…'} className="sm:min-w-44">
            {mode === 'create' ? 'Save listing' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
