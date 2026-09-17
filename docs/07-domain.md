# Domain notes

The API is the authority for every rule below; the Angular app mirrors them only to
avoid showing a screen it cannot use.

## Accounts

Two tables back sign-in: `users` (customers and company owners) and `admins` (super
admins, admins and agents). A user becomes a company owner by owning a row in
`companies`; `User#sync_role!` keeps the `role` column in step after any ownership
change, so ownership, not a stored flag, decides the role.

The token payload is `{ sub, kind, sid, exp, iat, jti }`. `sid` points at a `sessions`
row, so revoking that row (logout, or a password reset, which revokes all of a user's
sessions) invalidates every token issued for it. `Auth::ResolveAccount` turns a token
back into an `Api::Account` struct, the single value controllers authorize against.

## Guards

`ApplicationController` composes four checks, in this order:

1. `require_account!` — a live session must exist.
2. `require_verified_email!` — skipped for `/auth/me` and `/auth/logout` so an
   unverified account can still see itself and sign out.
3. `require_roles!` — exact role match; `super_admin` additionally inherits `admin`.
4. `require_permissions!` — any-of. Super admins bypass it; agents need the listed
   permission in their `permissions` array.

Agents are scoped further at the query level: they only ever see companies and reviews
reachable through `company_assignments`.

## Reviews

A review is created by a customer only, starts `pending`, and becomes visible publicly
when an admin or an assigned agent approves it. A company owner may reply exactly once;
the reply is stored on the review as a JSON document and is itself moderated, so it stays
hidden from anonymous readers until approved. Likes and dislikes are mutually exclusive
toggles per user, shares always append. Admins may not react to reviews.

## Response contract

Success is `{ data }`, or `{ data, meta }` for lists, where `meta` carries
`page, limit, pageSize, total, totalPages, hasNext, hasPrevious`. Errors are
`{ message, error, statusCode, requestId }` — including unknown routes under `/api/v1`,
which is why `routes.rb` ends the namespace with a catch-all rather than letting Rails
render HTML.
