# Albarka Properties Consultant Ltd. — Website and Admin Platform

Public website and administration platform for **Albarka Properties Consultant Ltd.**, built with Next.js 15 (App Router), PostgreSQL, and Prisma.

- **Public site:** home, about, services (eight families, with the corporate profile's service scope), who we serve, partnerships, property catalogue with search, filters, sorting and pagination, property detail pages with gallery and map, a contact form that stores enquiries, privacy, terms, sitemap and robots.
- **Admin area:** one-time-link account setup, sign-in, dashboard, property create/edit/delete with status and visibility rules, gallery upload, map picker, Super Admin administrator management, enquiries, activity log, settings (property types, features, featured count), and a profile page.

> **Sample content.** The seed script creates demonstration listings and AI-generated illustrations. Every one is titled `[Sample]`, flagged `isDemo`, and marked as a "Demonstration listing" on public cards. Replace them before launch. See [Before launch](#before-launch).

---

## Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15.5 (App Router), React 19, TypeScript |
| Database | PostgreSQL with Prisma 6 |
| Styling | Tailwind CSS 3.4, Manrope via `next/font` |
| Validation | Zod 3 (shared between client and server) |
| Images | `sharp` (re-encoded to WebP, metadata stripped) |
| Maps | Leaflet (used directly), OpenStreetMap tiles, Nominatim geocoding through a server proxy |
| Tests | Vitest (unit tests for the authorisation, validation, and publishing rules) |

## Quick start

Requirements: Node.js 20.9 or newer, and a PostgreSQL 14+ database.

```bash
npm install
cp .env.example .env          # then edit DATABASE_URL and APP_URL
npx prisma migrate deploy     # apply migrations
npm run db:seed               # optional: sample listings (marked as sample content)
npm run bootstrap:superadmin  # create the first Super Admin and print a one-time setup link
npm run dev                   # http://localhost:3000
```

Open the setup link printed by the bootstrap command, choose a password, then sign in at `/admin/login`.

### Environment variables

| Name | Purpose | Default / example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/albarka` |
| `APP_URL` | Public base URL. Setup links and canonical URLs use it. The session cookie is `Secure` only when this starts with `https://`. | `http://localhost:3000` |
| `MEDIA_DIR` | Directory for processed property photographs (outside `public/`) | `./storage/media` |
| `SESSION_MAX_HOURS` | Absolute session lifetime | `12` |
| `SESSION_IDLE_MINUTES` | Idle timeout | `120` |
| `TRUST_PROXY` | Trust `X-Forwarded-For` for client IPs (set `true` only behind your own proxy) | `false` |
| `NOMINATIM_BASE_URL` | Geocoder endpoint | `https://nominatim.openstreetmap.org` |
| `NOMINATIM_USER_AGENT` | Identifies your deployment to the geocoder (required by its usage policy) | `AlbarkaProperties/1.0 (contact@example.com)` |
| `NEXT_PUBLIC_MAP_TILE_URL` / `NEXT_PUBLIC_MAP_ATTRIBUTION` | Alternative map tile provider | OpenStreetMap |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | `prisma generate` and a production build |
| `npm run start` | Serves the production build on port 3000 |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run lint` | ESLint (Next.js rules) |
| `npm test` | Unit tests |
| `npm run db:migrate` | Apply migrations (production) |
| `npm run db:migrate:dev` | Create and apply a migration in development |
| `npm run db:seed` | Create sample categories, features, and listings (idempotent) |
| `npm run bootstrap:superadmin` | Create the first Super Admin (refuses if one is already active) |

## Roles and rules

**Roles.** A *Super Admin* manages everything, including administrator accounts, enquiries, the activity log, and settings. An *Administrator* sees and manages only the listings they created.

**Ownership** is enforced in three places: the page guard, the API route, and the database query. An administrator who requests another administrator's listing receives the same `404` as for a missing listing, so the existence of other listings is not revealed.

**Listings**
- A new listing is saved as **hidden**.
- A listing can be shown only when it has a title, both descriptions, a complete address, a price or "price on request", and a featured photograph. The listing page lists anything still missing.
- Availability values: *Available*, *Reserved*, *Sold* (sale listings), *Rented* (rental listings). Visibility: *Shown* or *Hidden*.
- A listing can be **deleted only after it has been hidden**.
- Exact map locations can be kept private (`mapIsPrivate`). The public page then shows the address but no map.

**Administrator accounts**
- The last active Super Admin cannot be removed or deactivated. Nobody can remove their own account.
- An administrator who still owns listings cannot be removed, only deactivated, so ownership is never transferred silently.
- Removal frees the email address for reuse; the audit history is kept.

**Credentials**
- Setup and reset links are one-time, shown once, and never stored in plain text. Setup links last 72 hours; reset links last 24 hours.
- Passwords must be at least 12 characters, include a letter and a digit, and must not contain the email name.
- Login failures return one generic message.
- Setting or changing a password, deactivating an account, or issuing a reset link revokes the existing sessions.
- Sessions are opaque random tokens; only their SHA-256 hash is stored.

**Photographs.** JPEG, PNG, or WebP up to 8 MB, checked by content (not file extension). Each upload is re-encoded to WebP and stripped of metadata, including camera location data. Storage names are random and never use the uploaded filename. Media is served through an access-checked route; hidden listings return `404` to the public and are served with `Cache-Control: private, no-store`.

**Security headers.** Content Security Policy, HSTS in production, `X-Frame-Options: DENY`, and a same-origin check on state-changing API requests. Contact enquiries are rate-limited (5 per IP per hour), with a honeypot field (`website`) that silently discards bot submissions.

## Project layout

```
prisma/                  schema, migrations, seed script, demo image assets
scripts/                 bootstrap-superadmin.ts
src/
  app/
    (public)/            public pages (home, about, services, properties, contact, privacy, terms)
    admin/               login, set-password, and the dashboard group (protected layout)
    api/                 JSON API: auth, admin, public properties, enquiries
    media/[...path]/     access-checked photograph route
    sitemap.ts, robots.ts, not-found.tsx, error.tsx
  components/            ui primitives, brand, layout, property, admin components
  config/                company details (single source), Nigerian states, services
  lib/                   auth, property services and rules, media, validation, security, http
tests/unit/              Vitest suites
```

## Content to confirm before launch

- **Corporate profile is the source of truth.** Identity (CAC RC 7062863, head office, motto, coverage) is in `src/config/company.ts`. Narrative (vision, mission, values, six-stage approach, who we serve, partnerships) is in `src/config/profile.ts`. Service families A–H are in `src/config/services.ts`. Leadership, testimonials and corporate documents are in `src/config/people.ts` and stay unpublished until verified.
- **Telephone numbers are hidden until confirmed.** The two numbers on the profile cover (08031175727, 08060473796) are unpublished by default. A Super Admin publishes them in **Settings → Public contact details**, after the company confirms them. The third number from the first brief (+234 803 874 1753) is not on the corporate profile and is not configured. Add it in Settings only after the company confirms it.
- **WhatsApp uses the primary number** (+234 806 047 3796), as instructed by the company. The button is hidden if the WhatsApp field in Settings is cleared.
- **Office map.** No coordinates are published for the head office. The contact page links to a search for the address until a verified location is supplied.
- **Business hours** were not supplied and are omitted.
- **Partnerships.** Adorn Cleaners & Environmental Services Ltd is described as a potential collaborative opportunity only. It is not exclusive, not confirmed, and has no logo.
- **Full checklist:** see `CONTENT_VERIFICATION.md`. Do not launch until every item is ticked.
- **Privacy policy and terms** are drafts. Have them reviewed by counsel for the Nigeria Data Protection Act 2023 and local consumer requirements before publication.

## Before launch

1. **Replace the sample content.** Delete the seeded listings (`isDemo = true`) in the database or from the admin area, and remove `prisma/seed-assets/demo/` if you will not seed again. Replace the AI-generated hero and home images in `public/images/` with real photography of the company's work and property.
2. **Create the real Super Admin** with `npm run bootstrap:superadmin`, then add administrators from the Administrators page.
3. **Set the production environment:** `APP_URL` with `https://`, a strong `DATABASE_URL`, `TRUST_PROXY` only behind your proxy, and a real `NOMINATIM_USER_AGENT` contact.
4. **Email delivery is not configured.** Setup and reset links are shown once in the admin area for the administrator to share privately. Add an email provider if automatic delivery is needed.
5. **Accessibility and contrast.** Check the brand colours (`brand-deep` and `neutral-muted`) against their backgrounds with a contrast tool, and test the admin forms with a screen reader.

## Known limitations

- A request for a listing by its internal id (rather than its slug) is redirected to the slug with a permanent redirect. Next.js sends this as a `308` delivered through a meta refresh, because the layout has already started streaming. Browsers follow it; crawlers generally do too. A true HTTP redirect would need to be added at the proxy or as a Node middleware.
- Map tiles come from OpenStreetMap, which has a usage policy. For high traffic, use a commercial tile provider via `NEXT_PUBLIC_MAP_TILE_URL`.
- Images are served by the application. For high traffic, place a CDN in front of `/media/` (responses are cached publicly for 5 minutes for shown listings).

## Tests

```bash
npm test
```

The corporate-content suites (`tests/unit/contact-gate.test.ts`, `tests/unit/corporate-profile.test.ts`) check the telephone publication gate, WhatsApp hidden by default, Settings access (Super Admin only), the Adorn wording, the eight service families and the five named services, the values and approach stages, and that no accreditation or experience claims appear in the content.

The unit suites cover: ownership and permission rules, deletion rules, administrator lifecycle rules, availability transitions, publishing requirements, password policy, form validation (enquiries, listings), catalogue filter parsing, slugs, price formatting, token hashing, IP pseudonymisation, and post-login redirect safety.

Manual checks used during the build (recorded here for the test plan): sign-in with the one-time link, reuse of a used link (rejected), generic login errors, cross-origin POST rejection, listing creation, photograph upload and publishing, the honeypot, the id-to-slug redirect, and access to every admin page.

## Licence and ownership

Built for Albarka Properties Consultant Ltd. The logo files in `public/brand/` are the client's supplied artwork and are used unmodified.
