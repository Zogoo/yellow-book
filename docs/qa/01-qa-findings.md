# QA findings — round 1

Role: QA engineer, with two independent audit passes (frontend UX, backend API).
Method: manual walkthrough of all four roles in a real browser, API probes against the
running stack, and a line-by-line read of `frontend/src/app` and `app/`.

Severity:

- **Blocker** — a core job cannot be completed, the product lies to the user, or data leaks.
- **Major** — the job completes but the behaviour is wrong, inconsistent or misleading.
- **Minor** — polish, wording, consistency.

Counts: 21 blockers, 46 major, 44 minor.

---

## A. Authentication and account creation

| ID | Sev | Finding |
|---|---|---|
| A1 | Blocker | **No customer sign-up exists.** The only registration is business registration behind "List Your Agency". `auth.service.ts:176` hardcodes `role: 'company'`. A person who wants to write a review cannot create an account. |
| A2 | Blocker | **The one-time-code login dead-ends new visitors.** `request_email_code.rb:13` returns 404 "No account exists for this email" with no offer to create one; two error toasts stack on screen. |
| A3 | Blocker | **Three login pages plus a role chooser for one credential.** `/auth/login`, `/auth/company/login`, `/auth/staff/login`; the modal's "User Login" tab (`login-modal.ts:40`) has no handler at all. |
| A4 | Blocker | **Signing in on the "wrong" portal destroys a valid session.** `login.ts:113` clears an authenticated session and bounces to another login page with no explanation. |
| A5 | Blocker | **Facebook and Apple sign-in can never succeed** (`auth.service.ts:198` allows only Google); Google itself fails unless `GOOGLE_CLIENT_ID` is set. Three of five buttons in the modal are decorative. |
| A6 | Major | **Auth-gated actions dead-end with a toast** instead of opening sign-in and resuming: review CTA (`agency.ts:608`), favourites (`favorites.service.ts:52`). |
| A7 | Major | **The login modal never resets.** `login-modal.ts:82` guards on a counter that is always truthy, so reopening shows the previous email and a stale "code sent" step. |
| A8 | Major | **OAuth "register" intent always lands on `/company/dashboard`** (`oauth-callback.ts:57`), which the guard immediately bounces for a customer account. |
| A9 | Major | **Account enumeration through three different oracles** (`request_email_code.rb:13`, `ensure_email_available.rb:13`, `login_account.rb:25`) while `forgot-password` carefully avoids it. |
| A10 | Minor | The one-time code is printed on screen when the API returns it (`email-code-login-form.ts:50`). |
| A11 | Minor | `authGuard` is dead code redirecting to a route that does not exist (`auth.guard.ts:15`). |

## B. Security and data integrity

| ID | Sev | Finding |
|---|---|---|
| B1 | Blocker | **Anonymous callers can read every unmoderated review**: `GET /agency/reviews?status=pending` with no token returned pending and rejected reviews platform-wide (`reviews_controller.rb:26`). |
| B2 | Blocker | **Every review response leaked the reviewer's email** (`review_serializer.rb:11`) including on public endpoints — a scraper could harvest the address of everyone who ever wrote a review. |
| B3 | Blocker | **Suspension has no teeth.** Status is checked only in password login; OTP login (`verify_email_code.rb:53`), Google (`oauth_sign_in.rb:12`) and token resolution (`resolve_account.rb:27`) ignore it, and suspending never revokes the 30-day sessions. |
| B4 | Blocker | **Admin password change went through a super-admin CRUD endpoint with no current-password check** (`admins_controller.rb:64`), so a stolen token was a permanent takeover — and ordinary admins could not change their own password at all. |
| B5 | Blocker | **Deleting a user destroys other people's reviews.** `user.rb:6` cascades to companies and `company.rb:6` cascades to reviews, so one admin click erases customers' review history with no audit row. |
| B6 | Blocker | **Any signed-in user could react to, and read, any review by id** including pending and rejected ones (`reviews_controller.rb:9`). |
| B7 | Major | **Share counts are unbounded and self-serve.** Every call inserts a row (`react_to_review.rb:26`) with no uniqueness and no rate limit. |
| B8 | Major | **Unlimited duplicate reviews.** The same customer could review the same company any number of times; no constraint, no cooldown, no rate limit. |
| B9 | Major | **Granular admin permissions are enforced on two controllers and inverted on one**: reading users needs `users_read`, but create/update/**delete** need nothing (`users_controller.rb:5`). |
| B10 | Major | **Agents see every company on the read paths** (`companies_controller.rb:13`) although the documented rule, and the write path, scope them to assignments. |
| B11 | Major | **`forgot-password` and `reset-password` have no rate limit** — unlimited reset-mail bombing and unlimited token guesses. Admins have no password-recovery path at all. |
| B12 | Major | **Moderation is not attributable.** Review status changes never record who made them, and `activity_events` has no actor column. |
| B13 | Major | **Email verification is a gate with no key.** Sign-up self-verifies with no proof; admin-created users default to unverified and are then locked out of the entire authenticated API with no resend endpoint. |
| B14 | Minor | The rate limiter counts in a per-process memory store, so the production limit is really `limit × workers` and resets on deploy. |
| B15 | Minor | Zero foreign keys in the schema; `dependent: :nullify` already produces reviews with a dangling author. |
| B16 | Minor | OTP codes and reset URLs are written to the log in every non-production environment. |

## C. Reviews, moderation and trust

| ID | Sev | Finding |
|---|---|---|
| C1 | Blocker | **Nothing in the domain ever created a notification.** No one was told about a new review, a moderation decision, or a company reply. |
| C2 | Blocker | **Company owners cannot review anyone.** Owning a company permanently sets the role to `company` and `create_review.rb:14` blocks all reviewing — the intended rule (do not review yourself) is never expressed. |
| C3 | Major | **A rejected company reply can never be resubmitted** (`reply_to_review.rb:13`) and no rejection reason is stored anywhere, for replies or reviews. |
| C4 | Major | **The public review feed becomes a private one when you sign in** (`scope_for_account.rb:14`): the same URL means three different things by role. |
| C5 | Major | **"Ban Reviewer" does not ban the reviewer** — it sets the review's status and leaves the account untouched (`manage-review.ts:274`). |
| C6 | Major | **Moderators cannot read what they moderate**: the admin table truncates reviews to three words, the dashboard to the first word (`dashboard.ts:241`). |
| C7 | Major | **Two different definitions of "average rating"** — the admin KPI averages every review, the public pages average approved ones only. |
| C8 | Major | **The "Banned Users" KPI invents a number**: with no bans it reports the count of low-rated reviews (`manage-review.ts:308`). |
| C9 | Major | **The editable star control clears to zero on a second click** and `saveEdit` has no validation, so a mis-click saves a 0-star review. |
| C10 | Minor | Review status vocabulary is incoherent: `hold` and `on_hold` both exist, `banned` and `suspended` are undistinguished, replies use a different set, and each panel offers a different subset. |
| C11 | Minor | A share count is rendered in two places with no share control anywhere in the product. |
| C12 | Minor | `reviews.likes/dislikes/shares` columns are dead — always 0 — but the serializer still falls back to them. |

## D. Truthfulness of what we show

| ID | Sev | Finding |
|---|---|---|
| D1 | Blocker | **The agency page invents contact details** — `www.<name>.com`, `+976 1234 5678`, `contact@example.com`, revenue `10000000` — and the "Go to website" button links to the fabricated domain. |
| D2 | Blocker | **Every company owner is given the same fake first-person quote** and a fake name and title, shown in quotation marks as if they wrote it (`agency.ts:466`). |
| D3 | Blocker | **The agency summary renders a hardcoded five stars** under the real average (`agency.ts:295`). |
| D4 | Major | **Home page platform statistics are invented constants** — "1548 Verified agencies, 5000+ Users, 25k+ Reviews" (`star-band.ts:22`). |
| D5 | Major | **Company descriptions are auto-fabricated** ("Leading X specialist serving Y") and rendered as the company's own copy (`directory.service.ts:126`). |
| D6 | Major | **Reviewer avatars are random stock faces from a third-party host**, and two reviewers can share a portrait (`agency.ts:215`). |
| D7 | Minor | An unconditional "Updated daily" badge (`popular-list.ts:52`). |
| D8 | Minor | Fake personal data as placeholders: "Wade Warren", "curtis.weaver@example.com", "+52 4164532", "+1 (555) 123-4567" in a Mongolian product. |
| D9 | Minor | A hardcoded green "online" dot on every panel avatar (`panel-profile-menu.ts:29`). |
| D10 | Minor | A debug API-connection badge is pinned to every customer-facing page (`app.ts:16`). |

## E. Forms that do not do what they say

| ID | Sev | Finding |
|---|---|---|
| E1 | Blocker | **"Change Password" changes nothing** in three screens (customer, company, agent): the new password is never sent and success is reported anyway. |
| E2 | Blocker | **"Current password" is decorative in all four password forms** — it is never verified. |
| E3 | Blocker | **The contact form discards the message** (`contact.ts:9`): no model binding, no endpoint, no feedback. |
| E4 | Blocker | **Admin "Update Permissions" saves nothing** (`settings.ts:87`) and its checkboxes can only ever be turned on, so they misrepresent real grants. |
| E5 | Major | **Password rules differ on every screen and none match the API** (API: 12 + 4 character classes; screens enforce 6, 8, or nothing while claiming 12). |
| E6 | Major | **Three admin tables and one agent table have select-all checkboxes with no bulk action.** |
| E7 | Major | **Sub-admin permissions can never be edited after creation**, and the role lists in the create and edit screens do not match. |
| E8 | Major | **"About yourself" silently eats the 25th word as you type** and advertises two different limits at once. |
| E9 | Minor | The agent "Last saved" indicator shows green even when loading the profile failed. |

## F. Navigation, naming and duplication

| ID | Sev | Finding |
|---|---|---|
| F1 | Blocker | **Admin review actions navigate into a route the guard blocks** (`/company/review/:id`), bouncing the admin back with no explanation. |
| F2 | Major | **"List Your Agency" behaves differently in the two navbars and is wrong in both when signed in** — one sends you to a browse page, the other toasts "please login" at an already-signed-in user. |
| F3 | Major | **"Popular Listing" points at three different destinations** across navbar, info nav and footer. |
| F4 | Major | **Global search silently discards the query**: `/catagory?q=` without `name` renders the category grid and never shows the term or a result. |
| F5 | Major | **Favourites use four different endpoints** across three screens, so the counts, the list and the hearts can disagree. |
| F6 | Major | **Company data is editable from two pages with overlapping fields and different endpoints**; last page wins. |
| F7 | Major | **The agent status filter runs after pagination**, so a filtered page can be empty under a footer claiming N results. |
| F8 | Major | **The category "Sort" menu contains no sort options** — it is a rating filter with a sort label. |
| F9 | Major | **Category cards mislabel their numbers**: "Rating" prints the review count and "Comment" prints the same number again. |
| F10 | Major | **The agent task donut can never exceed 40%** because the slices divide by 10 while the source arrays are sliced to four. |
| F11 | Major | **Adding a company reveals its hard requirement only on the last step**, and attaches the company to the first fuzzy search hit for the owner email. |
| F12 | Minor | One agent feature has three names: "my assign task", "My Assign Companies", "My Assigned Tasks" — none of which is English. |
| F13 | Minor | Sidebar labels are Title Case for admin/company and lower case for agent/customer. |
| F14 | Minor | The "no filter" option in four admin filters is labelled "Today", so the default state claims to show only today. |
| F15 | Minor | `/catagory` is a misspelling in a user-visible URL. |
| F16 | Minor | The FAQ heading is rendered twice on the FAQ page, and the same block is also the last section of the home page. |
| F17 | Minor | Sidebar says "Review", the page it opens says "Reviews". |
| F18 | Minor | A "More" tile is rendered as if it were a category. |
| F19 | Minor | The business registration form renders under the full consumer marketing hero. |

## G. API shape and performance

| ID | Sev | Finding |
|---|---|---|
| G1 | Major | **`PUT /company/profile` returns different data than `GET`** — unsent fields come back as empty strings, so a client that renders the response blanks the form. |
| G2 | Major | **`GET /companies` returns two different shapes** depending on whether the caller is an admin. |
| G3 | Major | **Two endpoints load unbounded result sets**: the company dashboard loads every review into Ruby to average it, and the public registration-options endpoint plucks every company row. |
| G4 | Major | **No session revocation**: `GET /sessions` lists devices, nothing can end one, and `lastActive` is just `created_at` renamed. Access tokens expire in 8h with no refresh. |
| G5 | Major | **`GET /subadmin/profile` returns an arbitrary agent's profile** when called without `adminId`. |
| G6 | Major | **`PUT /subadmin/companies/:id` accepts either an assignment id or a company id**, so it can silently act on a different company. |
| G7 | Minor | Five different delete response shapes across the API; `my-reviews` alone adds `perPage` to its meta. |
| G8 | Minor | `DELETE /companies/recent/:id` reads as "remove from the recent list" and hard-deletes the company. |
| G9 | Minor | Status casing differs between serializers for the same field. |
| G10 | Minor | Missing indexes for filters that exist (`reviews.status`, `reviews.rating`, notification ordering). |
| G11 | Minor | No "did I react to this?" state and no unread count, so the like button's active state and the notification badge cannot be correct. |
| G12 | Minor | Notifications carry no type or entity id, so they cannot deep-link to what they are about. |
| G13 | Minor | A company-owner account can never see notifications addressed to them as a person. |
| G14 | Minor | A super admin can be demoted or have their password reset by any other super admin, with no last-super-admin guard. |
| G15 | Minor | No self-serve account deletion or data export. |
| G16 | Minor | Dead denormalised columns on `favorites` that nothing writes. |

## H. Accessibility and interaction

| ID | Sev | Finding |
|---|---|---|
| H1 | Major | **The agent "Reject Verification" button is disabled once the checklist is complete** — the logic is inverted, so a company can only be rejected before it has been checked. |
| H2 | Minor | Modals have `role="dialog"` but no Escape handler and no focus trap. |
| H3 | Minor | Admin settings and agent profile "tabs" are buttons with no `role="tab"`/`aria-selected`. |
| H4 | Minor | Listing cards handle Enter on one page and Enter+Space on another. |
| H5 | Minor | Error toasts auto-dismiss in 3 seconds and silently drop the oldest past five. |
| H6 | Minor | Like/dislike are disabled for signed-out visitors with no explanation. |
| H7 | Minor | A redundant toast fires at the same moment a details dialog opens. |
| H8 | Minor | "Guest user" is rendered inside authenticated panels as a display-name fallback. |
| H9 | Minor | Translation infrastructure is wired and completely unused; every string is hardcoded English. |
