# Verification — Mongolia round

Role: QA engineer, re-testing after the localisation work in `02-localisation-plan.md`. Every
claim below was reproduced against the running stack (Rails `:3001`, Angular `:4200`) in a
browser or by API probe, and is covered by an automated test unless the row says otherwise.

## Result

| Suite | Before this round | After |
|---|---|---|
| RSpec (backend) | 85 | **96**, 0 failures |
| RuboCop | clean | clean (159 files) |
| Vitest (frontend) | 9 | **13**, 0 failures |
| Prettier | clean | clean |
| Playwright end-to-end | 32 | **38**, 0 failures |

Run the frontend unit tests with `npm test` (`ng test`), not `vitest` directly — the Angular
builder is what scopes them to `src/**/*.spec.ts`. Calling `vitest` picks up the Playwright
specs and fails on them.

The end-to-end suite runs twice in a row without failures and leaves the demo database as it
found it. `bin/rails db:seed` is idempotent and restores demo copy that tests edited.

## The reported bug

**"More" in the category grid did nothing.** It was a row in the categories table pretending to
be a category; clicking it re-opened the same page. The row is deleted, the home grid shows the
first eight categories with the number of listed companies, and a plain "View all categories"
link goes to the category index. Covered by `localisation.spec.ts` (no tile named *More* or
*Дэлгэрэнгүй* exists; the link lands on `/catagory`).

## What the Mongolian visitor gets

| Change | Evidence |
|---|---|
| The site opens in Mongolian; the header switcher stores the choice and survives a reload | `localisation.spec.ts` |
| 16 Mongolian categories with company counts, named in the chosen language by the API | `localisation_spec.rb`, `localisation.spec.ts` |
| Cyrillic search that ignores case (`ГОО УРЛАН` finds `Гоо Урлан Салон`) | `localisation_spec.rb`, `localisation.spec.ts` |
| District filter on the listing pages, the nine Ulaanbaatar districts | `localisation.spec.ts` |
| A tappable phone number and a Facebook link on every company page, formatted `+976 8822 0044` | `localisation.spec.ts`, `mongolia.spec.ts` |
| Registration number shown on the company page as a trust line | `localisation_spec.rb` |
| Prices and revenue bands in tugrik, not dollars | `mongolia.spec.ts` |

## Bugs this round found and fixed

These were not in the plan; the browser pass and the specs turned them up.

| Area | Defect | Fix |
|---|---|---|
| Frontend text utilities | `normalizeName` stripped everything outside `[a-z0-9]`, so **every** Mongolian name folded to `''` — unrelated companies compared equal, and a category page could match all listings | Unicode-aware folding (`\p{L}\p{N}`), covered by `mongolia.spec.ts` |
| Frontend slugs | `slugify` produced an empty string for any Cyrillic name | Romanises first, using the same table as `Api::Text` on the server |
| Category page | A Mongolian category link never matched a category, so the sidebar fell back to placeholder English filters (*Service Types / General Service*) | `getCategoryByName` matches the English name, the Mongolian name or the slug; the placeholder options are gone and empty filter groups are not rendered |
| Registration wizard | The category dropdown was built from companies that already exist, so a new business saw four English options | Served from the categories table, in the caller's language, all 16 |
| Business owner's panel | Entirely English. `/company/my-company` also had a stale hard-coded category list, Latin city names, revenue bands a thousand times too small, and "Consultation price (USD)" | The whole panel is translated — dashboard, company page, reviews and replies, profile, notifications, settings — and the company form is sourced from the same constants as the registration wizard. District, Facebook page and registration number are now editable: the public page showed them but the owner could not set them. Review states read as words, not raw enum values |
| Popular list | Whole page untranslated, prices formatted as USD | Translated; tugrik |
| Company page | Review count used the *companies* phrase ("2 байгууллага"), reviewer dates and headings untranslated, owner bio in English | Fixed, with singular and plural review counts |
| Seed data | English reviewer names under Mongolian review text, and reviews created only when the table was empty, so renaming a demo reviewer changed nothing | Mongolian names; reviews are kept in step with the seed list |
| End-to-end suite | Tests shared one demo customer, so the one-review-per-company rule made them fail in sequence; one test left edited demo copy behind | Each review-writing test creates and deletes its own customer; the profile test restores the original text |

## Known gaps

| Gap | Why it is still open |
|---|---|
| The admin and moderator panels are in English | Internal staff tooling. Everything a customer or a business owner touches is translated; these two panels are the last surface left. Worth its own round — the plumbing (translate pipe, locale header, key files) is already in place, so it is mechanical work, not design work. |
| Opening hours, `m.me` links, SMS verification, traditional script | Deferred in `02-localisation-plan.md` §6, unchanged. |
| The Mongolian copy has not been read by a native speaker | Written carefully, but a review pass before launch is the right call. |
| Category filter options (*Үсчин*, *Массаж*, …) exist only in Mongolian | They are business vocabulary stored as data; the English interface shows them as written, which matches the rule that user content is never translated. |
