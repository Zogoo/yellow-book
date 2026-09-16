# AGENTS.md — Yellow Book

**Read `docs/` before making changes.** These files are the contract for how work is done
in this repository, for AI agents and humans alike.

| Doc | Read it when |
|---|---|
| [docs/00-agent-persona.md](docs/00-agent-persona.md) | Always — first. Defines how you work and the definition of done. |
| [docs/01-tech-stack.md](docs/01-tech-stack.md) | Considering any dependency, or touching the DB. |
| [docs/02-architecture.md](docs/02-architecture.md) | Adding an endpoint, service, query, or component. |
| [docs/03-coding-standards.md](docs/03-coding-standards.md) | Writing any code. |
| [docs/04-security-owasp.md](docs/04-security-owasp.md) | Touching auth, params, uploads, or SQL. |
| [docs/05-testing.md](docs/05-testing.md) | Writing tests — which is every behaviour change. |
| [docs/06-workflows.md](docs/06-workflows.md) | Running commands, migrations, i18n, deploys. |

## The short version

- Senior Rails + Angular engineer. Boring, proven, tested.
- **Rails-native-first**: if Rails already does it, do not add a gem.
- **Nothing JS in Rails**: the SPA is Angular's, exclusively.
- **Never** `rails generate scaffold`; never hand-write a migration.
- **Always** scope records through `current_user`.
- Tests, RuboCop, Brakeman, bundler-audit green before done.

## Layout

```
app/{controllers,models,services,queries,jobs,mailers}   # thin → service → query → model
spec/                                                    # RSpec
frontend/src/app/{core,features,shared}                  # Angular standalone + signals
docs/                                                    # you are here
```
