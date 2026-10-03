# MyMoney

- [English](README.md)
- [Русский](README.ru.md)

MyMoney is a full-stack personal finance application. Track income, expenses, and transfers across multiple accounts and currencies, analyze spending with interactive charts.

## Features

- **Multi-currency accounts** — bank, cash, savings, crypto, and custom account types with icons
- **Income / expense / transfer tracking** — transactions with hierarchical categories, dates, descriptions
- **Spending analytics** — donut charts (Recharts) with period filtering

- **JWT authentication** — access tokens (Bearer) + refresh tokens (httpOnly cookies)
- **Email verification** — 6-digit code via SMTP (Yandex), 60s resend cooldown, 15min expiry
- **Password recovery** — forgot/reset password with email code
- **Rate limiting** — nginx (30r/s general, 5r/m auth) + NestJS ThrottlerModule (behind proxy)
- **Optimistic UI** — instant updates with TanStack Query optimistic mutations

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [Next.js 15](https://nextjs.org/) (App Router) | React framework |
| React 19 | UI library |
| Tailwind CSS 4 + shadcn/ui (New York) | Styling & primitives |
| Ant Design 6 | Date picker, additional components |
| Recharts 3 | Donut charts |
| TanStack Query 5 | Server state & optimistic updates |

| Framer Motion 12 | Animations |
| React Hook Form 7 | Form handling |
| Sonner | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| [NestJS 11](https://nestjs.com/) | Node.js framework |
| Prisma Next (v8) | ORM & migrations |
| PostgreSQL 17 | Database |
| JWT + Passport | Authentication |
| Argon2 | Password hashing |

| Nodemailer | SMTP email sending |
| @nestjs/throttler | Rate limiting (behind nginx proxy) |

| Decimal.js | Precise financial math |
| Cache Manager | Response caching |

### Infrastructure
| Service | Internal : External |
|---|---|
| Frontend (Next.js) | `3000` → `3001` (via nginx) |
| Backend (NestJS) | `3000` (internal) |
| nginx | `80` → `3001` |
| PostgreSQL 17 | `5432` |
| Adminer | `80` → `8080` |


## Project Structure

```
mymoney/
├── backend/                     # NestJS API server
│   ├── src/
│   │   ├── auth/                # JWT login, register, refresh, guards
│   │   ├── user/                # Profile CRUD
│   │   ├── account/             # Account CRUD (bank, cash, etc.)
│   │   ├── category/            # Hierarchical income/expense categories
│   │   ├── transaction/         # Income / expense / transfer CRUD

│   │   ├── currency/            # Exchange rates via CBR API
│   │   ├── prisma/              # Prisma client service
│   │   ├── config/              # JWT config, token config
│   │   └── common/enums/        # Shared enums (CurrencyCode)
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── seed.ts              # Currencies, account types
│   │   └── migrations/          # Prisma migrations
│   ├── test/                    # E2E tests
│   └── Dockerfile(.dev/.prod)
├── frontend/                    # Next.js web application
│   ├── src/
│   │   ├── app/                 # App Router: auth, dashboard (me/)
│   │   ├── components/          # UI primitives + dashboard components
│   │   │   ├── ui/              # shadcn/ui, buttons, cards, modals
│   │   │   ├── dashboard/       # Sidebar, accounts, categories, transactions
│   │   │   └── dashboard/.../skeletons/  # Loading skeletons
│   │   ├── hooks/               # useProfile, useAccounts, useTransactions, etc.
│   │   ├── services/            # API clients (auth, account, category, transaction)
│   │   ├── types/               # TypeScript interfaces (IAccount, ICategory, etc.)
│   │   ├── config/              # Route constants
│   │   ├── constants/           # SEO metadata
│   │   ├── lib/                 # Utils, formatters, chart helpers
│   │   └── api/                 # Axios interceptors, error helpers
│   └── Dockerfile(.dev/.prod)
├── nginx/
│   └── nginx.conf               # Reverse proxy (frontend + API)
├── package.json                 # Root task runner: bun run dev:backend / dev:frontend / dev:desktop
├── compose.yaml                 # Compose entry point (includes deploy/compose.yml)
├── deploy/
│   ├── compose.yml              # Full stack (PostgreSQL, backend, frontend, nginx, Adminer)
│   ├── compose.dev.yml          # Dev overrides (ports, volumes)
│   ├── compose.prod.yml         # Prod overrides
│   ├── compose.ci.yml           # CI-only BuildKit layer caches
│   ├── deploy.sh                # Deploy script (macOS/Linux)
│   └── deploy.bat               # Deploy script (Windows)
└── Insomnia_mymoney.yaml        # API collection for Insomnia
```

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine (Linux)
- [Bun](https://bun.sh/) — to run the root scripts
- Git
- Free ports: `3001`, `5432`, `8080`

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
## Development

All commands run from the repository root through the root `package.json`.
Run `bun run setup` once to install dependencies and generate the Prisma client.

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
|---|---|---|
| **User** | UUID, email, Argon2 hash |
| **PendingUser** | Unverified registration (removed after email confirmation) |
| **PasswordResetToken** | 6-digit code with expiry for password recovery |
| **Account** | Linked to user, type, category, currency; DECIMAL(15,2) balance |
| **Category** | Hierarchical (self-referencing), scoped to user, income/expense flag |
| **Transaction** | INCOME / EXPENSE / TRANSFER, updates balances atomically |
| **Currency** | RUB, USD, EUR, BTC |


All values use `DECIMAL(15,2)`. Collation: `utf8mb4_unicode_ci`.

## Security

- **Argon2** password hashing (not bcrypt)
- **JWT** access (15m) + refresh (7d) token pair
- **Refresh token** in httpOnly, SameSite=Lax cookie (XSS-resistant)
- **Soft-delete** for accounts (`isDeleted`) and categories (`isArchived`)
- **CORS** restricted to frontend origin
- **Rate limiting** double layer (nginx + NestJS) against brute-force and DDoS
- **Email verification** required before account activation
- **60-second cooldown** between code resends

## Notes

- UI is in Russian
- Currency exchange rates fetched from the Central Bank of Russia (CBR) API
- All financial math uses `Decimal.js` — no floating-point precision issues
