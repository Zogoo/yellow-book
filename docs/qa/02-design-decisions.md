# Design review and decisions — round 1

Input: `01-qa-findings.md` (21 blockers, 46 major, 44 minor).
Participants: staff engineer, product manager, UX designer, senior Rails engineer.
Output: the design we build, what we deliberately do not build, and why.

---

## 1. The core problem

The product was ported feature-for-feature from a prototype, so it inherited the prototype's
mental model: **the user must know who they are before the product will talk to them.** Three
login pages, a role chooser, and a sign-up flow that only exists for businesses. A person who
wants to do the one thing this platform is for — write a review — cannot even create an account.

Everything else in the findings is downstream of two habits: asking the user to do the system's
job, and showing invented data rather than admitting we have none.

## 2. What good looks like

Trustpilot gets two things right that we will copy: a consumer can go from a company page to a
published review in under a minute, and businesses live in a clearly separate space. Its most
common complaints are the ones we will beat:

| Complaint about Trustpilot | What we do instead |
|---|---|
| Opaque moderation — reviews vanish with no reason | Every review shows its state to its author, with the reason when it is rejected |
| Unclear whether a reviewer is real | Reviews carry the reviewer's own name and a generated initials avatar; never a stock portrait |
| Businesses feel ambushed | The company owner is notified the moment a review lands, and can reply once, with the reply moderated and visible as "pending" to them |
| Support is a maze | One contact form that actually reaches an administrator |

## 3. Decisions

### D1 — One front door
`/auth/login` serves everyone. It asks for an email, then adapts:

- account exists → send a one-time code, with "use my password instead" as a second option;
- account does not exist → the same screen becomes "create your account" (name + code, or
  name + password), and the account is created on verification.

`/auth/company/login` and `/auth/staff/login` become redirects that keep `?next=`. The login
modal renders the same component; the role chooser is deleted. After authentication the server's
role decides the destination — the user never picks a portal.

**Rationale:** the credential already identifies the role. Asking first is the system delegating
its own routing to the user, and it is the direct cause of A3, A4 and half of the confusion in F2.

### D2 — Sign-up is a first-class, visible action
The navigation shows `Log in`, `Sign up`, and `For businesses`. Business registration keeps its
own page and no longer hides behind a consumer call to action.

### D3 — Intent survives authentication
Clicking "Write a review" or the favourite heart while signed out opens sign-in with the intent
attached and returns the user to the exact action afterwards. No dead-end toasts.

### D4 — We never show data we do not have
Fabricated contact details, owner quotes, platform statistics, hardcoded five stars, stock
portraits and auto-written company descriptions are removed. Missing data becomes an honest empty
state ("No website listed"). Real counts come from a public `GET /stats` endpoint.

### D5 — One review per customer per company, editable
A second review returns `409` with the existing review's id, and the UI offers to edit it. This is
the single most effective abuse control for a rating platform and it is also the kinder behaviour.

### D6 — Moderation is transparent and attributable
Status changes record the moderator. Authors see their review's state; rejected reviews carry a
reason. Company replies show "pending review" to the owner and stay hidden from the public until
approved.

### D7 — Notifications are real
A new review notifies the company; a moderation decision notifies the author; a reply notifies the
author once it is published; a submitted reply notifies a moderator. The bell in every panel opens
a real inbox with an unread count.

### D8 — Security is not negotiable
Suspension is enforced at token resolution and on every sign-in path, and suspending revokes
sessions. Unmoderated reviews and reviewer email addresses never reach the public. Changing a
password requires the current one and revokes other sessions. An admin cannot delete an account in
a way that erases third parties' reviews.

### D9 — One vocabulary
One password policy (12 characters, mixed case, digit, symbol) stated and enforced identically
everywhere. One review status set. One employees/revenue enumeration. One favourites endpoint. One
delete response shape.

## 4. Deliberately not doing now — senior engineer's pushback

These came up in review and were cut, with reasons. They are real, they are just not this round.

| Item | Why not now |
|---|---|
| An `/auth/identify` endpoint to check if an email exists | It is a purpose-built account-enumeration oracle. The front door gets the same result by attempting a login-code and falling back to sign-up, with no new surface. |
| Refresh-token rotation | Sessions already live 30 days and the access token is 8 hours. Rotation is worth doing, but it is a security-sensitive subsystem that deserves its own change, not a corner of a UX release. Tracked. |
| Domain or email ownership verification for companies | Needs deliverable mail and a DNS story. Auto-approval stays off in production; claiming still goes through an administrator. Tracked. |
| Soft deletes, data export, self-serve account deletion | A coherent retention policy is a project. The urgent half — one click must not erase other people's reviews — is in this round; the rest is tracked. |
| Bulk moderation actions | The select-all checkboxes are removed rather than wired: bulk moderation without an audit trail and an undo is how platforms destroy trust at scale. |
| A full i18n rollout | The infrastructure stays, the strings stay English. Half-translated products are worse than untranslated ones. |
| Rewriting the rate limiter onto a shared store | Correct and cheap later; it needs a cache service decision (Solid Cache) that is out of scope here. The auth limits still work per process and now cover password reset. |
| Renaming `/catagory` | We add `/category` and keep the misspelling as a permanent redirect. Breaking inbound links to fix a typo is not worth it. |

## 5. Order of work

1. **Backend integrity** — leaks, suspension, cascade guard, reaction abuse, permissions, agent
   scoping, rate limits, notifications, dedup, password change, stats, support messages.
2. **The front door** — unified login, sign-up, modal, navigation, intent preservation.
3. **Truth and correctness** — remove invented data, wire real password changes, dedup UX,
   notification inbox, fix inverted and misrouted controls.
4. **Consistency pass** — vocabulary, labels, filters, toasts, dialogs.
5. **Verification** — unit, request and end-to-end suites, then a fresh browser walkthrough of all
   four roles.
