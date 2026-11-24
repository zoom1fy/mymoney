# AGENTS.md

Technical guide for maintainers and AI coding agents working on **MyMoney**.
For the user-facing overview, see [README.md](README.md) and
[README.ru.md](README.ru.md).

MyMoney is a personal finance app shipped as a self-hosted web application and
as an offline-first desktop application. The repository is a monorepo: NestJS
API, Next.js frontend shared by both targets, and a Tauri 2 desktop shell.

The interface and user-facing messages are in Russian. Code, comments, commit
messages and this document are in English.

---

## 1. Repository layout

```
mymoney/
├── .github/workflows/           # ci.yml, docker.yml, release.yml
├── .opencode/                   # Local agent skills (not part of the app)
├── backend/                     # NestJS API server
│   ├── src/
│   │   ├── auth/                # register, login, refresh, verification, reset
│   │   ├── user/                # Profile CRUD
│   │   ├── account/             # Account CRUD, types, groups, category totals
│   │   ├── category/            # Hierarchical categories, archive/restore
│   │   ├── transaction/         # Income / expense / transfer CRUD and summaries
│   │   ├── dashboard/           # Aggregated dashboard endpoint
│   │   ├── currency/            # Currency list, exchange rates, provider fallback
│   │   ├── queue/               # BullMQ jobs: email, new-user seeding
│   │   ├── mail/                # SMTP via Nodemailer
│   │   ├── seed/                # Starter data for a new account
│   │   ├── prisma/              # contract.prisma, generated client, money helpers
│   │   ├── config/              # JWT and token config
│   │   └── common/              # Shared enums, proxy-aware throttler guard
│   ├── migrations/              # Prisma Next migration plans and snapshots
│   ├── test/                    # E2E suite and ORM runtime mocks
│   ├── prisma-next.config.ts
│   ├── docker-entrypoint.sh
│   └── Dockerfile.dev / Dockerfile.prod
├── frontend/                    # Next.js app (web + desktop webview)
│   ├── src/
│   │   ├── app/                 # App Router: auth, dashboard (/me)
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   └── dashboard/       # Sidebar, categories, transactions, settings
│   │   ├── hooks/               # TanStack Query hooks
│   │   ├── services/            # HTTP clients + local/* SQLite adapters
│   │   ├── types/               # TypeScript interfaces
│   │   ├── lib/                 # Formatters, chart helpers, platform detection
│   │   ├── api/                 # Axios interceptors, error helpers
│   │   └── middleware.ts        # Web-only auth redirects
│   ├── scripts/                 # Desktop dev/build wrappers
│   └── Dockerfile.dev / Dockerfile.prod
├── desktop/                     # Tauri 2 shell
│   ├── src-tauri/
│   │   ├── src/                 # Rust: plugins, SQLite migrations, DB backup
│   │   ├── migrations/          # SQLite schema, seed, rates, balance triggers
│   │   ├── capabilities/        # Tauri permissions
│   │   ├── tauri.conf.json      # Single source of truth for the version
│   │   └── Cargo.toml
│   └── scripts/                 # tauri.mjs / fe.mjs wrappers
├── db/                          # PostgreSQL image with the nightly backup cron
├── deploy/                      # Compose overrides and deploy scripts
│   ├── compose.yml              # Full stack (base definition)
│   ├── compose.dev.yml          # Dev overrides (Dockerfiles, ports, volumes)
│   ├── compose.prod.yml         # Prod overrides
│   ├── compose.ci.yml           # BuildKit layer caches for CI only
│   ├── deploy.sh                # Interactive deploy (macOS/Linux)
│   └── deploy.bat               # Interactive deploy (Windows)
├── nginx/nginx.conf             # Reverse proxy and rate limits
├── scripts/app-version.mjs      # Propagates the version to every manifest
├── backups/                     # Host mount for pg_dump files (git-ignored)
├── compose.yaml                 # Compose entry point (includes deploy/compose.yml)
└── package.json                 # Root task runner
```

## 2. Toolchain

| Tool | Version / notes |
|---|---|
| **Bun** | `1.2.18` is pinned in CI and in the Dockerfiles. Use `bun` for installs and scripts, not npm or yarn. Lockfiles: `backend/bun.lock`, `frontend/bun.lock`. |
| **Node.js** | `24` for the backend runtime and CI. The frontend dev image runs Bun; the Bun image is also used to install dependencies. |
| **Rust** | Stable toolchain for the desktop build. |
| **Docker** | Compose v2.20+ is required because the root `compose.yaml` uses `include`. |
| **PostgreSQL** | 17 (alpine), built from `db/Dockerfile`. |
| **Redis** | 7 (alpine), used by BullMQ. |

## 3. First-time setup

```bash
# From the repository root
bun run setup                 # installs backend + frontend, emits the Prisma contract
cp .example.env .env          # Windows: Copy-Item .example.env .env
```

Fill in `.env` before starting anything. The backend reads the root `.env`
through `ConfigModule` (`envFilePath: ['../.env', '.env.local']`), and Docker
Compose reads it automatically.

Start the infrastructure:

```bash
docker compose -f compose.yaml -f deploy/compose.dev.yml up -d db redis
```

### Running the backend

```bash
bun run dev:backend           # NestJS on http://localhost:3000
```

If the backend runs on the host (not in Docker), change `DATABASE_URL` in
`.env` from `@db:5432` to `@localhost:5432` and set `REDIS_HOST=localhost`.

### Running the frontend

```bash
bun run dev:frontend          # Next.js on http://localhost:3000
```

Both the backend and the Next dev server default to port `3000`. The usual local
workflow is to run the backend through Docker (published on `4200`) and the
frontend on the host:

```bash
docker compose -f compose.yaml -f deploy/compose.dev.yml up -d db redis backend
bun run dev:frontend
```

The axios client falls back to `http://localhost:4200/api` when
`NEXT_PUBLIC_API_URL` is unset (`frontend/src/api/interceptor.ts`), so this works
without extra configuration. To point the frontend elsewhere, create
`frontend/.env` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:4200/api
NEXT_PUBLIC_COOKIE_DOMAIN=localhost
```

`NEXT_PUBLIC_*` variables are baked in at build time. Restart or rebuild after
changing them.

### Running the desktop app

```bash
bun run dev:desktop           # Tauri window; starts the frontend with NEXT_PLATFORM=desktop
bun run build:desktop         # installers into desktop/src-tauri/target/release/bundle
```

The desktop app does not need PostgreSQL, Redis or the backend. It starts its
own Next dev server on port `3000`, so do not run `dev:frontend` at the same
time.

Desktop prerequisites: Rust stable plus the
[Tauri system dependencies](https://tauri.app/start/prerequisites/) for your
platform. On Linux that means `libwebkit2gtk-4.1-dev`,
`libayatana-appindicator3-dev`, `librsvg2-dev`, `libxdo-dev`, `libssl-dev` and
`build-essential`.

## 4. Environment variables

| Variable | Required | Purpose / default |
|---|---|---|
| `POSTGRES_USER` | yes | PostgreSQL user (`postgres`). |
| `POSTGRES_PASSWORD` | yes | PostgreSQL password. Must match `DATABASE_URL`. |
| `POSTGRES_DB` | yes | Database name (`mymoneydb`). |
| `DATABASE_URL` | yes | `postgresql://user:pass@db:5432/mymoneydb` in Compose; `@localhost` for a host-run backend. |
| `JWT_SECRET` | yes | Secret used to sign access and refresh tokens. |
| `JWT_ACCESS_EXPIRES_IN` | yes | Access-token lifetime, e.g. `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | yes | Refresh-token lifetime, e.g. `7d`. |
| `CORS_ORIGINS` | yes | Comma-separated allowed origins (`http://localhost:3001`). |
| `SMTP_HOST` / `SMTP_PORT` | yes | SMTP server for verification and reset emails. |
| `SMTP_USER` / `SMTP_PASS` | yes | SMTP credentials. Yandex requires an app password. |
| `SMTP_FROM` | yes | Sender address. |
| `SMTP_TLS` | yes | `true` for STARTTLS (port 587). |
| `NEXT_PUBLIC_API_URL` | yes | API base for the browser. `http://localhost:3001/api` behind nginx, `http://localhost:4200/api` for a host-run frontend. |
| `NEXT_PUBLIC_COOKIE_DOMAIN` | no | Cookie domain, usually `localhost`. |
| `REDIS_HOST` | no | `redis` in Compose; `localhost` when the backend runs on the host. |
| `REDIS_PORT` | no | `6379`. |
| `BACKUP_KEEP` | no | Number of nightly dumps to keep (`14`). |
| `DOCKER_DEFAULT_PLATFORM` | no | `linux/amd64`; set it in Compose for Apple Silicon compatibility. |

`.env` and its variants are git-ignored. Never commit real secrets.

Note: the refresh JWT lifetime is controlled by `JWT_REFRESH_EXPIRES_IN`, but the
httpOnly cookie expiry is currently fixed at one day
(`AuthService.EXPIRE_DAY_REFRESH`). Keep both in mind when changing auth
settings.

## 5. Root commands

Run everything from the repository root.

| Command | What it does |
|---|---|
| `bun run setup` | Install backend + frontend dependencies and emit the Prisma client. |
| `bun run dev:backend` | NestJS in watch mode (`:3000`). |
| `bun run dev:frontend` | Next.js dev server (`:3000`). |
| `bun run dev:desktop` | Tauri window with the desktop frontend. |
| `bun run build` | Build backend, frontend and desktop. |
| `bun run build:desktop` | Desktop installers only. |
| `bun run lint` | ESLint for backend + frontend. |
| `bun run typecheck` | `tsc --noEmit` for backend + frontend. |
| `bun run test` | Jest (backend) + Vitest (frontend). |
| `bun run test:cov:backend` | Backend tests with coverage. |
| `bun run test:e2e:backend` | Backend E2E suite (ORM and argon2 are mocked; no DB needed). |
| `bun run docker:up` | Build and start the dev stack detached. |
| `bun run docker:logs` | Follow Compose logs. |
| `bun run docker:down` | Stop the dev stack. |
| `bun run version` | Propagate the current version to all manifests. |
| `bun run version:set -- 0.2.0` | Set a new version everywhere. |
| `bun run version:check` | Fail if manifests have drifted. |

Package-specific scripts are delegated with `--cwd`:

```bash
bun run --cwd backend prisma:migrate:dev
bun run --cwd frontend test:watch
```

Useful backend scripts:

| Script | Purpose |
|---|---|
| `prisma:generate` | Emit the typed client from `contract.prisma`. |
| `prisma:migrate:dev` | Plan a migration (`prisma-next migration plan`). |
| `prisma:migrate` | Apply migrations (`prisma-next migrate`). |
| `prisma:verify` | Verify the database against the contract. |

Useful frontend scripts: `dev`, `dev:desktop`, `build`, `build:desktop`, `lint`,
`typecheck`, `test`, `test:watch`.

## 6. Architecture

### Request path (web)

```
Browser → nginx :3001
              ├── /      → frontend:3000 (Next.js)
              └── /api/* → backend:3000  (NestJS, global prefix "api")
```

nginx is the only public entry point for the application itself. It sets
`X-Real-IP` and `X-Forwarded-For`, which the NestJS throttler trusts through
`ThrottlerBehindProxyGuard`. The base Compose file also publishes PostgreSQL,
Redis and Adminer for local access — see the port table below.

| Service | Dev host port | Production host port |
|---|---|---|
| nginx (app) | `3001` → 80 | `3001` → 80 |
| Backend | `4200` → 3000 | not published |
| Frontend | not published directly | not published directly |
| PostgreSQL | `5432` | `5432` |
| Redis | `6379` | `6379` |
| Adminer | `8080` | `8080` |

Production clears the backend/frontend ports but leaves the database, Redis and
Adminer ports from the base file. If the host is publicly reachable, restrict
them with a firewall or an additional Compose override.

### Authentication

- Registration is two-step: `PendingUser` stores the Argon2 hash and a 6-digit
  code; the account is created only after `verify-email`.
- Codes are valid for 15 minutes. Resends have a 60-second cooldown.
- `verify-email` and `login` return `{ user, accessToken }` and set a
  `refresh_token` httpOnly, SameSite=Lax cookie. In production the cookie is
  `Secure`.
- The access token is also stored in a client-readable `access_token` cookie so
  the browser can send `Authorization: Bearer …`. Axios refreshes it through
  `POST /api/auth/login/access-token` on `401`.
- Password reset tokens are single-use and consumed in the same transaction as
  the password update.
- Rate limits: nginx `30 r/s` per IP (`burst=50`), `5 r/min` on `/api/auth/*`
  (`burst=3`), max 10 concurrent connections per IP; NestJS adds a global
  `30 requests / 10 s` limit and `5 / min` on auth routes.

### Dashboard and currency

- `GET /api/dashboard` runs its queries in parallel and returns `profile`,
  `accounts`, `categoryTotals`, `baseCurrencyCode`, `categories`,
  `archivedCategories`, `expenseSummary`, `incomeSummary`.
- Account balances stay in their own currency. Aggregates are converted into
  RUB (`BASE_CURRENCY` in `common/constants/base-currency.constant.ts`).
- 16 currencies: RUB, USD, EUR, GBP, JPY, CNY, BTC, ETH, USDT, USDC, BNB, XRP,
  SOL, TRX, DOGE, GRAM.
- Rates are resolved through CBR, Frankfurter, ExchangeRate.host, CoinGecko,
  Binance and the Fawaz Ahmed CDN, in that order. Successful rates are cached in
  `ExchangeRate` and resynced every three hours.

### Background jobs

BullMQ queue `tasks` on Redis:

- `send-verification-email`
- `send-password-reset-email`
- `seed-new-user`

`seed-new-user` adds starter categories, two accounts and sample transactions so
a new dashboard is not empty.

### Desktop path (offline)

- `NEXT_PLATFORM=desktop` makes Next render the dashboard directly, skips auth
  redirects and produces a static export; the auth pages are removed after the
  build.
- `frontend/src/services/local/*` implements the same service contracts as the
  HTTP clients, backed by `tauri-plugin-sql`.
- Balances are updated by SQLite triggers on `Transaction`
  (`0004_transaction_balance_triggers.sql`). Do not adjust balances manually in
  JS.
- The database lives in Tauri's local app-data directory as `mymoney.db`
  (`app.mymoney.desktop`): `%LOCALAPPDATA%\app.mymoney.desktop` on Windows,
  `~/Library/Application Support/app.mymoney.desktop` on macOS,
  `~/.local/share/app.mymoney.desktop` on Linux.
- Migrations are embedded into the Rust binary and applied at startup by SQLx.
  If they fail, the reason is written to `mymoney-startup-error.log` in the same
  directory.
- Single-instance plugin focuses the existing window instead of opening a second
  pool on the same file.
- The manual backup command uses `VACUUM INTO` for a consistent snapshot.

## 7. API reference

Base URL behind nginx: `http://localhost:3001/api`.

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | `{ email, password }` → `{ email }`, sends a code |
| POST | `/verify-email` | — | `{ email, code }` → user + tokens |
| POST | `/resend-code` | — | `{ email }`, 60 s cooldown |
| POST | `/forgot-password` | — | `{ email }`, sends a reset code |
| POST | `/reset-password` | — | `{ email, code, password }` |
| POST | `/login` | — | `{ email, password }` → user + tokens |
| POST | `/login/access-token` | Cookie | Rotate the token pair from the refresh cookie |
| POST | `/logout` | — | Clear the refresh cookie |

### User (`/api/user`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile` | JWT | Get the profile |
| PATCH | `/profile` | JWT | Update email / password |
| DELETE | `/profile` | JWT | Delete the account |

### Accounts (`/api/accounts`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create an account |
| GET | `/` | JWT | List active accounts |
| GET | `/:id` | JWT | Get one |
| PATCH | `/:id` | JWT | Update |
| DELETE | `/:id` | JWT | Soft delete |

### Categories (`/api/category`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create |
| GET | `/` | JWT | List active |
| GET | `/archived` | JWT | List archived |
| GET | `/:id` | JWT | Get one |
| PATCH | `/:id` | JWT | Update |
| DELETE | `/:id` | JWT | Archive, cascading to subcategories |
| PATCH | `/:id/unarchive` | JWT | Restore |

### Transactions (`/api/transactions`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create `INCOME` / `EXPENSE` / `TRANSFER` |
| GET | `/` | JWT | Cursor-paginated list |
| GET | `/summary` | JWT | Totals by category for a type and period |
| GET | `/:id` | JWT | Get one |
| PATCH | `/:id` | JWT | Update (rollback + apply) |
| DELETE | `/:id` | JWT | Delete and reverse the balance |

List filters: `take` (default 20), `cursor`, `accountId`, `type`, `from`, `to`.
Summary requires `type`; `from` and `to` are optional.

### Dashboard (`/api/dashboard`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | Profile, accounts, categories and both summaries in one response |

Query: `from`, `to` (applied to both summaries).

### Currency (`/api/currency`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List all currencies |
| GET | `/rate?from=USD&to=RUB` | — | Cached or live rate |

## 8. Data model

The authoritative definition is `backend/src/prisma/contract.prisma`. The
desktop schema mirrors it in `desktop/src-tauri/migrations/0001_init.sql`
(UUID → TEXT, Decimal → TEXT, Boolean → INTEGER, DateTime → ISO-8601 TEXT).

| Entity | Description |
|---|---|
| **User** | UUID, unique email, Argon2 hash, `lastLogin`. |
| **PendingUser** | Unverified registration with a 6-digit code and `sentAt`. Removed after verification. |
| **PasswordResetToken** | Per-user code with `expiresAt`, `usedAt`; single use. |
| **Currency** | 16 rows: 6 fiat, 10 crypto. |
| **ExchangeRate** | `(from, to)` primary key, decimal rate, refreshed every 3 h. |
| **AccountCategory** | Sidebar group: main, savings, investments, loans and debts. |
| **AccountType** | Cash, bank, deposit, brokerage, credit card, crypto wallet. |
| **Account** | User, group, type, currency, name, icon, decimal balance, `isDeleted`. |
| **Category** | Self-referencing hierarchy, user-scoped, expense flag, color, icon, `isArchived`; unique `(userId, name)`. |
| **Transaction** | `INCOME` / `EXPENSE` / `TRANSFER`, optional `targetAccountId` and `categoryId`, decimal amount, date, description. |

Amounts use fixed-precision decimal columns, not floats. `money()` rounds to two
decimal places before writes, and DTO validation rejects more than two decimals.

## 9. Database workflow

- `backend/src/prisma/contract.prisma` is the source of truth. Never edit
  generated files (`contract.json`, `contract.d.ts`, `db.ts`) by hand.
- Check in migration plans and snapshots under `backend/migrations/`. Do not
  hand-edit `backend/migrations/app/refs/db.json`; it is produced by Prisma Next.
- After changing the contract:

```bash
bun run --cwd backend prisma:generate
bun run --cwd backend prisma:migrate:dev   # plans the migration
bun run --cwd backend prisma:migrate       # applies it
bun run --cwd backend prisma:verify
```

- The Docker entrypoint waits for Redis, applies migrations, and falls back to
  `prisma-next db update` if no migration path exists.
- New accounts are seeded asynchronously through the queue.

## 10. Docker and deployment

`compose.yaml` is the entry point. It includes `deploy/compose.yml` and keeps the
project directory at the repository root, so build contexts and bind mounts are
relative to the root.

| Overlay | Purpose |
|---|---|
| `deploy/compose.dev.yml` | Dev Dockerfiles, source mounts, publishes the backend on `4200`. |
| `deploy/compose.prod.yml` | Production Dockerfiles, no published backend/frontend ports. |
| `deploy/compose.ci.yml` | BuildKit `type=gha` layer caches for CI only. |

```bash
bun run docker:up     # dev: build and start detached
bun run docker:logs   # follow logs
bun run docker:down   # stop
```

Reset the database completely:

```bash
docker compose -f compose.yaml -f deploy/compose.dev.yml down -v
```

Production:

```bash
docker compose -f compose.yaml -f deploy/compose.prod.yml up --build -d
```

`deploy/deploy.sh` and `deploy/deploy.bat` wrap the same commands with a mode
prompt.

## 11. Backups

**Server.** The `db` image runs cron next to PostgreSQL. Every night at `03:00`
it writes a compressed `pg_dump -Fc` to `/backups/mymoney-<timestamp>.dump`
(mounted as `./backups`) and prunes everything beyond `BACKUP_KEEP` (default
14). Logs go to `/backups/backup.log`.

**Desktop.** Settings → Data → Save a copy invokes the Rust `backup_database`
command, which uses `VACUUM INTO` and a native save dialog. It refuses to
overwrite the live database file.

## 12. Security notes

- Argon2 password hashing.
- Access JWT (15 min) and refresh JWT (7 days by default) with token rotation.
- Refresh token in an httpOnly, SameSite=Lax cookie; `Secure` in production.
- Email verification required before an account exists.
- 60-second cooldown between code resends.
- Single-use reset tokens, consumed atomically with the password update.
- Soft delete for accounts (`isDeleted`) and archive for categories
  (`isArchived`).
- CORS restricted to `CORS_ORIGINS`.
- Two rate-limit layers (nginx + NestJS) and a per-IP connection cap.
- Desktop webview uses a scoped CSP and a trimmed Tauri permission set.
- Do not log tokens, codes, passwords or SMTP credentials.

## 13. Versioning and releases

`desktop/src-tauri/tauri.conf.json` is the single source of truth. The script
propagates its version to `Cargo.toml` and every `package.json`
(`scripts/app-version.mjs`).

```bash
bun run version              # sync all manifests to the current version
bun run version:set -- 0.2.0 # set a new version everywhere
bun run version:check        # fail on drift
```

A tag `v<version>` starts the release pipeline. CI rejects a tag that does not
match `tauri.conf.json`. The release workflow waits for the CI run on the same
commit, builds installers with `tauri-action` for Windows, macOS and Linux,
then publishes the draft release.

Release assets include MSI/NSIS (Windows), DMG/`.app` (macOS), AppImage/deb/rpm
(Linux). CI also uploads a portable Windows zip.

## 14. CI

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | pushes to `main`/`develop`, PRs, `v*` tags | Version sync, backend lint/typecheck/tests/coverage/build, frontend lint/typecheck/tests/build, desktop bundles on `main` and tags. |
| `docker.yml` | pushes to `main`/`develop` | Boots the production Compose stack and smoke-tests HTTP 200. |
| `release.yml` | `v*` tags | Waits for CI, builds installers, publishes the GitHub release. |

Failures send a Telegram notification if the secrets are configured.

## 15. Working agreements

- Keep `README.md` and `README.ru.md` short and user-facing: overview, quick
  start, and links. Put API details, data-model notes and operational internals
  in this file instead of growing the README.
- When a user-visible feature changes, update both README language versions and
  add an entry to `CHANGELOG.md`.
- Use **Bun** and the root scripts. Do not introduce npm/yarn lockfiles.
- Keep the web and desktop service contracts in sync. A change in
  `frontend/src/services/*.service.ts` usually needs the matching
  `frontend/src/services/local/*.service.ts` change and vice versa.
- Desktop balance changes belong in SQLite triggers, not in JS.
- When changing the Prisma contract, regenerate the client and add a migration;
  never edit generated files or applied migrations.
- Keep user-facing strings in Russian and code identifiers in English.
- The API returns Russian validation messages; preserve that unless the change
  explicitly targets localization.
- Tests: backend Jest (`*.spec.ts`), frontend Vitest (`*.test.ts`), backend E2E
  mocks the ORM runtime through `moduleNameMapper`. Add or update tests with
  every behavior change.
- Run `bun run lint`, `bun run typecheck` and `bun run test` before committing.
- Do not commit `.env`, `backups/`, `frontend/out/`, `backend/dist/` or
  `desktop/src-tauri/target/`.
- Comments should explain *why* (constraints, edge cases, trade-offs), not
  restate the code.
