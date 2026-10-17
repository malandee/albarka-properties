# Content verification checklist

Complete every item before the public site goes live. Tick a box only when the evidence is on file.
The corporate profile (Final, 2026) is the authoritative source. Anything not in it must be confirmed before it is shown.

Owner: ______________________   Date verified: ______________   Approved by (Super Admin): ______________________

---

## 1. Telephone numbers and WhatsApp

- [ ] **Telephone 1: +234 806 047 3796** (08060473796, on the profile cover). Company has confirmed it may be published. Publish in *Settings → Public contact details*.
- [ ] **Telephone 2: +234 803 117 5727** (08031175727, on the profile cover). Company has confirmed it may be published.
- [ ] **+234 803 874 1753** appeared in the first brief but is **not on the corporate profile**. Company confirms whether it is an official line. If not, leave it out. If yes, add it in Settings with the publish box ticked.
- [x] **WhatsApp** uses the primary number, +234 806 047 3796. Instructed by the company. Clearing the WhatsApp field in Settings hides the button.
- [ ] Each published number has been called or messaged to confirm it reaches the company.

## 2. Email, address, and office location

- [ ] Email **albarkapropertiesconsultantltd@gmail.com** is monitored and is the correct enquiry address. No other email is shown.
- [ ] Head office wording matches the profile: *Block A, No. 7, Nasara Shopping Complex, Opposite Old Dass Park Junction, Bauchi, Bauchi State, Nigeria.*
- [ ] Office coordinates are **not** published. If a map is wanted, the company supplies a verified location (latitude and longitude) and the config is updated.
- [ ] Business hours: company supplies them, or they remain omitted.

## 3. Corporate identity

- [ ] CAC registration **RC 7062863** is verified against the current CAC status report.
- [ ] Motto **"Our Client's Success is Our Success."** is approved for use.
- [ ] Coverage statement *"We serve clients nationwide across Nigeria, subject to the requirements and capacity of individual assignments."* is approved.
- [ ] Social accounts (Facebook, Instagram, TikTok, X) are confirmed as the company's official accounts.

## 4. Leadership (`src/config/people.ts`)

- [ ] Each role's full name, official title, approved portrait, and verified biography are supplied in writing.
- [ ] Each role is set to `approved: true` only after the above. Until then the Leadership section stays hidden.
- [ ] No qualification, experience, or credential is stated unless it is documented.

## 5. Testimonials (`src/config/people.ts`)

- [ ] Each testimonial is genuine, and the client has consented in writing to publication and to the attribution (name, organisation, role).
- [ ] Only testimonials with `approved: true` and `consentOnFile: true` appear. The list is empty until then.

## 6. Corporate documents and credentials

- [ ] CAC incorporation documents and current status report: copies inspected, valid, and current.
- [ ] Current Tax Clearance Certificate: inspected and valid.
- [ ] Employees' Compensation Scheme certificate (or equivalent): inspected.
- [ ] Any licence, permit, registration, or professional credential is **verified** before it is mentioned anywhere on the site. Nothing is claimed by default.
- [ ] Documents are not published on the public site unless the company decides to publish them. Each entry in `CORPORATE_DOCUMENTS` remains `published: false` until then.

## 7. Accreditation, licences, and regulated work

- [ ] The site makes **no** accreditation, engineering registration, valuation certification, or regulated-authority claim. Confirm this still holds.
- [ ] **Valuation services**: confirm the professional requirements and the qualifications held for each assignment.
- [ ] **Water engineering**: confirm the approvals and standards that apply to borehole drilling, treatment plant installation, and water packaging. The family page carries a note.
- [ ] **Renewable energy and power systems**: confirm the authorisations and resources for installation and maintenance. The family page carries a note.
- [ ] **Import and export**: confirm the activity is within the registered scope and applicable laws.
- [ ] **Public procurement**: confirm the company's position on public-sector bids (the profile says public institutions are subject to procurement requirements).

## 8. Service descriptions (`src/config/services.ts`)

- [ ] Each of the eight families and their items is reviewed against actual capability. Remove or re-word anything the company does not deliver.
- [ ] The site does not imply that every service is delivered in-house. The approach text (*"through our own operational arrangements, procurement and project coordination, or collaboration with qualified specialist partners"*) is kept.
- [ ] The five proposal services appear by exact name: General Contracts, Property Management, Consultations, Land and Landed Property Agency, Valuation Services.
- [ ] Seven original services are represented within the eight families. Nothing has been dropped.

## 9. Partnerships (Adorn Cleaners & Environmental Services Ltd)

- [ ] The company confirms the relationship is described accurately: a **potential collaborative relationship**, not exclusive, not confirmed as a contract, and with no completed joint project.
- [ ] Adorn has been told how it is described on the site.
- [ ] **No logo** is used unless Adorn gives written permission and the company approves it.
- [ ] The "Discuss a Partnership" action reaches a monitored inbox (enquiries, subject *Partnership or collaboration*).

## 10. Imagery

- [ ] Images on family pages are labelled **illustrative** and are not presented as Albarka projects. The home hero is labelled the same way.
- [ ] Company photography replaces AI-generated illustrations before launch. Each replacement has alt text that describes the image accurately.
- [ ] Photographs of properties or projects are used only with the owner's or company's permission.

## 11. Legal pages

- [ ] Privacy policy and terms of use have been reviewed by counsel for the Nigeria Data Protection Act 2023 and local consumer requirements.
- [ ] The privacy policy names the company, email, and address as above.

## 12. Search, metadata, and structured data

- [ ] `APP_URL` is the final `https://` domain.
- [ ] Organization structured data shows only published information. It contains no hours, ratings, social profiles, or unconfirmed telephone numbers.
- [ ] The sitemap lists the public pages, family pages, and visible listings only.
- [ ] Each family page and the About page has a unique title and description.

## 13. Final technical checks

- [ ] `npm test` passes (including `contact-gate` and `corporate-profile`).
- [ ] `npm run build` completes without errors.
- [ ] With no WhatsApp number set, no WhatsApp button appears on any page (including the property page and contact page).
- [ ] With no telephone number published, no telephone number appears on any public page.
- [ ] Publishing a number in Settings makes it appear on the footer, contact page, and property pages.
- [ ] Settings changes create an audit entry.
- [ ] A Property Admin account cannot open Settings or change corporate content.
- [ ] Sample listings are labelled *Demonstration listing* and are removed or replaced before launch.

---

## Sign-off

| Area | Verified by | Date |
|---|---|---|
| Contact details and WhatsApp | | |
| Corporate identity and credentials | | |
| Leadership and testimonials | | |
| Services and regulated-work notes | | |
| Partnerships (Adorn) | | |
| Imagery | | |
| Legal pages | | |
| Technical checks | | |
