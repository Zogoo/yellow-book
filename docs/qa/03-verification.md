# Verification — round 1

Role: QA engineer, re-testing after implementation. Every claim below was reproduced against
the running stack (Rails :3001, Angular :4200) in a browser or by API probe, and is covered by an
automated test unless stated.

## Result

| Suite | Before | After |
|---|---|---|
| RSpec (backend) | 63 | **85**, 0 failures |
| RuboCop | clean | clean (156 files) |
| Vitest (frontend) | 9 | 9, 0 failures |
| Prettier | clean | clean |
| Playwright end-to-end | 26 | **32**, 0 failures |

The end-to-end suite runs twice in a row without failures and leaves the demo database exactly as
it found it.

## What changed, by finding

### Blockers — all closed

| ID | Fix | Evidence |
|---|---|---|
| A1 | Customer sign-up exists: "Sign up" in the navigation and footer, `/auth/signup`, and inline creation in the sign-in flow | e2e *a new visitor creates a customer account from the same form* |
| A2 | An unknown email no longer errors — the same form becomes "Create your account" | same test, plus browser walkthrough |
| A3 | One sign-in page for every role; the role chooser is gone; the old paths redirect | e2e *every protected route leads to the one sign-in page* |
| A4 | No session is destroyed on sign-in: the server's role decides the destination | covered by the role-routing test |
| A5 | Providers that cannot work are not shown; Google appears only when configured | `environment.googleAuthEnabled` |
| B1 | Anonymous callers cannot widen the review feed by status | spec *never returns unmoderated reviews to anonymous callers* |
| B2 | Reviewer email is returned only to moderators, the company, and the author | spec *never returns the reviewer's email to anonymous callers* |
| B3 | Suspension is enforced at token resolution and on every sign-in path, and revokes sessions | spec *suspension* (3 cases) |
| B4 | Password change is a real endpoint requiring the current password; admins cannot bypass it through the CRUD route | spec *passwords* (2 cases) |
| B5 | Deleting an account that owns companies is refused with an explanation | spec *refuses to delete an account whose companies hold other people's reviews* |
| B6 | Reactions and reads are limited to published reviews | spec *refuses reactions on unpublished reviews* |
| C1 | Notifications exist for: review received, review moderated, reply submitted, reply published, contact message | spec *notifications*, verified in the bell UI |
| C2 | A company owner may review other companies, never their own | spec *lets a company owner review other companies but not their own* |
| D1–D3 | The agency page shows only data the company provided; no invented phone, website, email, owner quote or five-star row | browser walkthrough |
| E1–E2 | All four password forms change the password, verify the current one, and state one policy | e2e *changing a password really changes it* |
| E3 | The contact form reaches an administrator queue and can be closed out | e2e *the contact form reaches an administrator* |
| E4 | The decorative permission editor is replaced by an honest read-only view of your grants | browser walkthrough |
| F1 | Admin review actions open the public page instead of a route the guard blocks | browser walkthrough |
| H1 | The agent's "Reject verification" button is no longer disabled by completing the checklist | browser walkthrough |

### Major — closed

A6 (intent survives sign-in, with the reason shown), A7 (the modal resets), A9 (no toast-and-error
double reporting), B7 (a share counts once per person), B8 (one review per customer per company,
enforced by a unique index and a 409 that points at the existing review), B9 (write permissions on
user management), B10 (agents read only their assignments), B11 (password reset is rate limited),
B12 (moderation records who and why), C3 (a rejected reply can be rewritten), C4 (the public feed
stays public), C5 (the mislabelled button now says what it does), C6 (moderators can read the
review), C8 (the invented "banned users" number is gone), C9 (a review cannot be saved at zero
stars), D4–D6 (real platform counters, no invented descriptions, initials avatars), E5 (one
password policy), E6 (select-all checkboxes removed rather than left inert), E7 (sub-admin
permissions are editable after creation), E8 (the About field no longer eats what you type), F2–F4
(one "For businesses" destination, one "Popular listing" destination, search shows results), F5
(one favourites endpoint), F6 (the two company editors have distinct jobs and link to each other),
F7 (the agent status filter runs on the server), F8–F9 (the rating filter is called a rating
filter; the card metrics are rating and review count), F10 (the task donut reflects the real
queue), G1 (`GET` and `PUT /company/profile` return the same shape), G3 (dashboard aggregates in
SQL; the options endpoint is bounded and cached), G4 (sessions can be revoked), G5 (no stranger's
profile), G6 (the assignment endpoint no longer guesses).

### Minor — closed

N1/F12/F13/F17 (bell opens a real inbox with an unread count; consistent, English sidebar labels),
N9/N10 (no raw HTTP framing in messages, one message per failure), D7–D10 (no "updated daily"
claim, no fake personal placeholders, no presence dot, the connection badge is development-only),
H2 (dialogs close on Escape), H4 (the same keyboard behaviour on both listing pages), H5 (errors
stay on screen for eight seconds), H7 (no toast duplicating a dialog), F14 (the empty filter option
says "Any time"), F16 (one FAQ heading), C11 (no share count without a share control), plus label
bindings on the profile forms so every field has a real label.

## Two regressions I introduced and caught here

1. **A signed-in customer saw no reviews on a company page.** Tightening the public feed also
   narrowed the company page to the caller's own reviews. Fixed, and locked down by a spec that
   checks the anonymous, customer, author and moderator views of the same company.
2. **The "resume your review after signing in" effect never ran.** It read its own flag before the
   session signals, so Angular recorded no dependency. Fixed by reading the signals first; covered
   by an end-to-end test that signs up from inside the review dialog.

## Still open — deliberately, with reasons in `02-design-decisions.md`

Refresh-token rotation, company ownership verification, soft deletes and data export, bulk
moderation, a shared-store rate limiter, and the i18n rollout. Two smaller ones stay on the list
too: notifications carry no entity id yet, so the inbox cannot deep-link to the review it is about,
and `reviews.likes/dislikes/shares` remain dead columns behind the real counts.
