# MyMoney

- [English](README.md)
- [Русский](README.ru.md)

MyMoney is a full-stack personal finance application. Track income, expenses, and transfers across multiple accounts and currencies, analyze spending with interactive charts. Ships as a web app and as an offline-first desktop app.

## Features

- **Multi-currency accounts** — 6 types (cash, bank, deposit, brokerage, credit card, crypto wallet) grouped into 4 sidebar sections, each with an icon
- **Income / expense / transfer tracking** — transactions with hierarchical categories, colors, icons, dates and descriptions
- **Spending analytics** — donut charts (Recharts) with a date-range filter, aggregated on the server
- **One-request dashboard** — `GET /api/dashboard` returns the profile, accounts, categories and both summaries at once

- **JWT authentication** — access tokens (Bearer) + refresh tokens (httpOnly cookies)
- **Email verification** — 6-digit code via SMTP (Yandex), 60s resend cooldown, 15min expiry
- **Password recovery** — forgot/reset password with a single-use email code
- **Background jobs** — BullMQ on Redis for outgoing email and first-login data seeding
- **Rate limiting** — nginx (30r/s general, 5r/m auth) + NestJS ThrottlerModule (behind proxy)
- **Optimistic UI** — instant updates with TanStack Query optimistic mutations

- **Desktop app** — Tauri 2 with a local SQLite database, fully usable without the backend
- **Nightly backups** — compressed `pg_dump` inside the database container, with rotation
- **Light and dark themes** — responsive down to mobile, with loading skeletons

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [Next.js 15](https://nextjs.org/) (App Router) | React framework |
| React 19 | UI library |
| Tailwind CSS 4 + shadcn/ui (New York) | Styling & primitives |
| Recharts 3 | Donut charts |
| TanStack Query 5 | Server state & optimistic updates |
| Framer Motion 12 | Animations |
| React Hook Form 7 | Form handling |
| Sonner | Toast notifications |
| next-themes | Light / dark theme |
| lucide-react | Icons |
| react-day-picker + date-fns | Calendar & date handling |
| react-number-format | Amount inputs |
| react-colorful | Category color picker |
| @tauri-apps/api + plugin-sql / plugin-http | Desktop bridge |

### Backend
| Technology | Purpose |
|---|---|
| [NestJS 11](https://nestjs.com/) | Node.js framework |
| Prisma Next (v8) | ORM & migrations |
| PostgreSQL 17 | Database |
| Redis 7 + BullMQ | Background jobs |
| JWT + Passport | Authentication |
| Argon2 | Password hashing |
| Nodemailer | SMTP email sending |
| @nestjs/throttler | Rate limiting (behind nginx proxy) |
| @nestjs/axios | Outbound HTTP for exchange rates |

### Desktop
| Technology | Purpose |
|---|---|
| [Tauri 2](https://tauri.app/) | Desktop shell |
| Rust + SQLx | SQLite access and migrations |
| tauri-plugin-sql | SQLite from the webview |
| tauri-plugin-http | HTTP from the webview |
| tauri-plugin-single-instance | One window per installation |

### Infrastructure
| Service | Internal : External |
|---|---|
| Frontend (Next.js) | `3000` → `3001` (via nginx) |
| Backend (NestJS) | `3000` (internal) |
| nginx | `80` → `3001` |
| PostgreSQL 17 | `5432` |
| Redis 7 | `6379` |
| Adminer | `80` → `8080` |


## Project Structure

```
mymoney/
├── .github/workflows/           # ci.yml, docker.yml, release.yml
├── backend/                     # NestJS API server
│   ├── src/
│   │   ├── auth/                # register, login, refresh, email verification, reset
│   │   ├── user/                # Profile CRUD
│   │   ├── account/             # Account CRUD, account types & groups
│   │   ├── category/            # Hierarchical income/expense categories, archive
│   │   ├── transaction/         # Income / expense / transfer CRUD and summaries
│   │   ├── dashboard/           # Single aggregated dashboard endpoint
│   │   ├── currency/            # Currency list and exchange rates with fallbacks
│   │   ├── queue/               # BullMQ tasks: emails, new-user seeding
│   │   ├── mail/                # SMTP sending via Nodemailer
│   │   ├── seed/                # Starter data for new accounts
│   │   ├── prisma/              # Prisma client + contract.prisma data contract
│   │   ├── config/              # JWT config, token config
│   │   └── common/              # Shared enums, proxy-aware throttler guard
│   ├── migrations/              # prisma-next migrations
│   ├── test/                    # E2E tests and ORM mocks
│   ├── prisma-next.config.ts
│   └── Dockerfile.dev / Dockerfile.prod
├── frontend/                    # Next.js web application
│   ├── src/
│   │   ├── app/                 # App Router: auth, dashboard (me/)
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui primitives, buttons, modals, pickers
│   │   │   └── dashboard/       # Sidebar, accounts, categories, transactions, profile
│   │   ├── hooks/               # use-accounts, use-categories, use-transactions, ...
│   │   ├── services/            # HTTP clients + local/* adapters for the desktop build
│   │   ├── types/               # TypeScript interfaces
│   │   ├── lib/                 # Formatters, chart helpers, platform detection
│   │   ├── api/                 # Axios interceptors, error helpers
│   │   └── middleware.ts
│   ├── scripts/                 # Desktop dev/build helpers
│   └── Dockerfile.dev / Dockerfile.prod
├── desktop/                     # Tauri 2 application
│   ├── src-tauri/
│   │   ├── src/                 # Rust: plugins, SQLite migrations on startup
│   │   ├── migrations/          # SQLite schema, seed, rates, balance triggers
│   │   ├── capabilities/        # Tauri permissions
│   │   ├── tauri.conf.json      # Single source of truth for the version
│   │   └── Cargo.toml
│   └── scripts/                 # tauri.mjs / fe.mjs wrappers
├── db/                          # PostgreSQL image with the nightly backup cron
├── deploy/                      # Compose overrides and deploy scripts
│   ├── compose.yml              # Full stack (PostgreSQL, Redis, backend, frontend, nginx, Adminer)
│   ├── compose.dev.yml          # Dev overrides (Dockerfiles, ports, volumes)
│   ├── compose.prod.yml         # Prod overrides
│   ├── compose.ci.yml           # CI-only BuildKit layer caches
│   ├── deploy.sh                # Deploy script (macOS/Linux)
│   └── deploy.bat               # Deploy script (Windows)
├── nginx/
│   └── nginx.conf               # Reverse proxy, rate limits (frontend + API)
├── scripts/app-version.mjs      # Propagates the version to every manifest
├── backups/                     # Local mount for pg_dump files (git-ignored)
├── compose.yaml                 # Compose entry point (includes deploy/compose.yml)
└── package.json                 # Root task runner: bun run dev:backend / dev:frontend / dev:desktop
```

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/desktop/) (Windows/macOS) or Docker Engine (Linux)
- [Bun](https://bun.sh/) — to run the root scripts
- Git
- Free ports: `3001`, `5432`, `6379`, `8080`

### 1. Clone and configure

```bash
git clone <repository_url>
cd mymoney
cp .example.env .env
```

Edit `.env`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_pass
POSTGRES_DB=mymoneydb
DATABASE_URL=postgresql://postgres:your_pass@db:5432/mymoneydb
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_COOKIE_DOMAIN=localhost

# SMTP (for email verification & password recovery)
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=your-email@yandex.ru
SMTP_PASS=your-app-password
SMTP_FROM=your-email@yandex.ru
SMTP_TLS=true

# Optional — the defaults below are what Compose and the backend already use
REDIS_HOST=redis
REDIS_PORT=6379
BACKUP_KEEP=14
```

### 2. Start

```bash
# macOS / Linux
./deploy/deploy.sh

# Windows
deploy\deploy.bat
```

Or manually:

```bash
bun run docker:up
```



### 3. Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Adminer | http://localhost:8080 |


## API Reference

### Authentication (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register `{email, password}` → returns `{email}` |
| POST | `/api/auth/verify-email` | — | Verify 6-digit code `{email, code}` → tokens |
| POST | `/api/auth/resend-code` | — | Resend code `{email}` (60s cooldown) |
| POST | `/api/auth/forgot-password` | — | Request password reset `{email}` |
| POST | `/api/auth/reset-password` | — | Reset password `{email, code, password}` |
| POST | `/api/auth/login` | — | Login `{email, password}` |
| POST | `/api/auth/login/access-token` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | — | Clear refresh token |

All auth endpoints are rate-limited to **5 requests per minute per IP** (nginx + NestJS).

Response: `{ user: {id, email}, accessToken }` + `refresh_token` httpOnly cookie.

### User (`/api/user/profile`)
| Method | Auth | Description |
|---|---|---|
| GET | JWT | Get profile |
| PATCH | JWT | Update email / password |
| DELETE | JWT | Delete account |

### Accounts (`/api/accounts`)
| Method | Auth | Description |
|---|---|---|
| POST | JWT | Create account |
| GET | JWT | List all active |
| GET `/:id` | JWT | Get by ID |
| PATCH `/:id` | JWT | Update |
| DELETE `/:id` | JWT | Soft-delete |

### Categories (`/api/category`)
| Method | Auth | Description |
|---|---|---|
| POST | JWT | Create category |
| GET | JWT | List active categories |
| GET `/:id` | JWT | Get by ID |
| PATCH `/:id` | JWT | Update |
| DELETE `/:id` | JWT | Archive (with subcategories) |
| GET `/archived` | JWT | List archived |
| PATCH `/:id/unarchive` | JWT | Restore |

### Transactions (`/api/transactions`)
| Method | Auth | Description |
|---|---|---|
| POST | JWT | Create (INCOME / EXPENSE / TRANSFER) |
| GET | JWT | List with pagination & filters |
| GET `/:id` | JWT | Get by ID |
| PATCH `/:id` | JWT | Update (rollback + apply) |
| DELETE `/:id` | JWT | Delete (reverse balance) |

**Filters:** `take`, `cursor`, `accountId`, `type`, `from`, `to`

### Dashboard (`/api/dashboard`)
| Method | Auth | Description |
|---|---|---|
| GET | JWT | Profile, accounts, categories and income/expense summaries in one response |

**Query:** `from`, `to` — applied to both summaries. Accounts are returned in their
own currency; summaries are converted to RUB.

### Currency (`/api/currency`)
| Method | Auth | Description |
|---|---|---|
| GET | — | List all currencies |
| GET `/rate` | — | Rate for `?from=USD&to=RUB` |

Rates are tried against six providers in order (CBR, Frankfurter, ExchangeRate.host,
CoinGecko, Binance, Fawaz Ahmed CDN) and cached in the database, so a single
provider outage does not break conversions.

## Development

All commands run from the repository root through the root `package.json`.
Run `bun run setup` once to install dependencies and emit the Prisma contract.

### Run

```bash
bun run dev:backend    # NestJS API on :3000
bun run dev:frontend   # Next.js on :3000
bun run dev:desktop    # Tauri window with the embedded frontend
```

The API and the desktop app need PostgreSQL and Redis. Either start them with
`bun run docker:up` (full stack in containers) or bring up just the services:

```bash
docker compose -f compose.yaml -f deploy/compose.dev.yml up -d db redis
```

### Desktop app

The desktop build needs a Rust toolchain plus the [Tauri prerequisites](https://tauri.app/start/prerequisites/)
for your platform — on Linux that means `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`,
`librsvg2-dev` and `libxdo-dev`.

```bash
bun run dev:desktop      # Tauri window against the dev server
bun run build:desktop    # Installers into desktop/src-tauri/target/release/bundle
```

The desktop app stores everything in a local SQLite file and never talks to the
backend. Account balances there are maintained by SQLite triggers, so a crash
mid-write cannot leave a balance out of sync with its transactions.

### Checks

```bash
bun run lint          # backend + frontend
bun run typecheck     # backend + frontend
bun run test          # backend + frontend
bun run build         # backend + frontend + desktop
```

Per-package variants are available too: `bun run test:backend`,
`bun run test:cov:backend`, `bun run test:e2e:backend`, `bun run lint:frontend`,
`bun run build:desktop`.

To run a script that only exists in one package, delegate to it directly:

```bash
bun run --cwd backend prisma:migrate:dev
bun run --cwd frontend test:watch
```

### Versioning

`desktop/src-tauri/tauri.conf.json` is the single source of truth.

```bash
bun run version              # propagate the current version to every manifest
bun run version:set -- 0.2.0 # set a new version everywhere
bun run version:check        # fail if the manifests have drifted
```

Tag the commit `v<version>` to trigger the release pipeline. CI rejects a tag
whose number does not match the app version.

### Docker

`compose.yaml` in the repository root is the entry point; environment-specific
overrides live in `deploy/`.

```bash
bun run docker:up     # dev stack, built and detached
bun run docker:logs   # follow logs
bun run docker:down   # stop

docker compose -f compose.yaml -f deploy/compose.dev.yml down -v   # Reset DB
```

Swap `compose.dev.yml` for `compose.prod.yml` to run the production stack.
`deploy/deploy.sh` (or `deploy\deploy.bat`) does the same interactively.

## Database

| Entity | Description |
|---|---|
| **User** | UUID, email, Argon2 hash, last login |
| **PendingUser** | Unverified registration (removed after email confirmation) |
| **PasswordResetToken** | 6-digit code with expiry, single-use for password recovery |
| **AccountCategory** | Sidebar group: main accounts, savings, investments, loans and debts |
| **AccountType** | Cash, bank, deposit, brokerage, credit card, crypto wallet |
| **Account** | Linked to user, type, group, currency; balance + `isDeleted` |
| **Category** | Hierarchical (self-referencing), scoped to user, income/expense flag, color, icon, `isArchived` |
| **Transaction** | INCOME / EXPENSE / TRANSFER, updates balances atomically |
| **Currency** | 16 currencies: 6 fiat (RUB, USD, EUR, GBP, JPY, CNY) and 10 crypto |
| **ExchangeRate** | Cached rate per pair, resynced every 3 hours |

Amounts are stored in fixed-precision decimal columns rather than floats, and
inputs are validated to at most two decimal places.

## Security

- **Argon2** password hashing (not bcrypt)
- **JWT** access (15m) + refresh (7d) token pair
- **Refresh token** in httpOnly, SameSite=Lax cookie (XSS-resistant)
- **Soft-delete** for accounts (`isDeleted`) and categories (`isArchived`)
- **CORS** restricted to the configured origins
- **Rate limiting** double layer (nginx + NestJS) against brute-force and DDoS
- **Email verification** required before account activation
- **60-second cooldown** between code resends
- **Single-use reset tokens**, consumed in the same transaction as the password update
- **Scoped CSP** and a trimmed permission set in the desktop webview

## Backups

The `db` image runs cron next to PostgreSQL and dumps a compressed `pg_dump`
every night at 03:00 into `./backups`, keeping the newest `BACKUP_KEEP` files
(14 by default) and pruning the rest.

## Notes

- UI is in Russian
- Currency exchange rates are fetched from six providers with automatic failover
- Licensed under AGPL-3.0