# Yellow Book

A company directory and review platform: Rails 8.1 API + Angular 21 SPA, SQLite,
deployable to a single Fly.io machine. In production Rails serves the built
Angular bundle from `public/` and the JSON API under `/api/v1`.

## Requirements

Docker and Docker Compose. Nothing else — Ruby and Node run inside containers.

## Getting started

```bash
docker compose up
```

| Service | URL |
|---|---|
| API | http://localhost:3001 |
| App | http://localhost:4200 |
| Mailpit (email) | http://localhost:8025 |
| MinIO console | http://localhost:9001 |

Seed the demo data (categories, companies, reviews, notifications, assignments):

```bash
docker compose run --rm backend bin/rails db:seed
```

| Role | Email | Password |
|---|---|---|
| Super admin | admin@yellowbook.local | AdminSecure123! |
| Agent (sub-admin) | agent@yellowbook.local | AgentSecure123! |
| Company owner | company@yellowbook.local | CompanySecure123! |
| Customer | user@yellowbook.local | UserSecure123! |

Customers can also sign in with a one-time email code. Outside production the code is
written to the Rails log and returned in the response, so no inbox is needed.

## Tests and checks

```bash
docker compose run --rm test                       # RSpec
docker compose run --rm frontend npm run test:ci   # Vitest
docker compose run --rm frontend npm run lint      # Prettier
docker compose run --rm backend bin/rubocop
docker compose run --rm backend bin/brakeman
docker compose run --rm backend bin/bundler-audit
```

End-to-end smoke tests drive a real browser against both servers. Start the API on
:3001 and the app on :4200, then:

```bash
cd frontend && npx playwright test
```

## Domain

Four roles share one API. Customers write reviews and save favourites, company owners
manage their listing and reply once per review, agents moderate the companies and
reviews assigned to them, and admins manage everything. Replies and reviews are both
published only after moderation.

## Structure

```
app/controllers/api/v1/    # JSON endpoints, thin: parse, authorize, render
app/services/              # business logic, one public .call
app/queries/               # list filters (search, status, category, date windows)
app/serializers/           # response shapes for each projection
app/lib/api/               # error types, params, pagination, the account struct
frontend/src/app/core/     # api/auth/toast services, guards, interceptors, role rules
frontend/src/app/features/ # public pages plus the user, company, admin and agent panels
frontend/tests/e2e/        # Playwright smoke suite
docs/                      # engineering contract — read this first
```

## Access rules

`frontend/src/app/core/utils/role-access.ts` holds the single source of truth for which
role may open which path, and mirrors what the API enforces. Unauthenticated visitors to
a panel path are sent to the login page for that panel (`/auth/login`,
`/auth/company/login`, `/auth/staff/login`) with a `next` parameter.

## Environment

Every variable is documented in [.env.example](.env.example). Development values are set
directly in `docker-compose.yml`; production values are Fly secrets. Three switches are
specific to this app:

| Variable | Effect |
|---|---|
| `ALLOW_AUTH_DEBUG_RESPONSES` | Returns the one-time login code in the API response. Defaults to on in development only. |
| `DISABLE_RATE_LIMIT` | Turns off per-IP auth throttling. Defaults to on in the test environment only. |
| `AUTO_APPROVE_COMPANIES` | Approves companies at registration outside production. |

## Deploying

`fly.toml` is committed and ready. Run `rake fly:setup` from the generator project to
create the app, volume, storage bucket and secrets, then:

```bash
fly deploy
```

Pushes to `main` deploy automatically once the `FLY_API_TOKEN` repository secret is set.

## Conventions

See [AGENTS.md](AGENTS.md) and [docs/](docs/). Short version: Rails-native-first, nothing
JS in Rails, always scope by the current account, tests green before done.
