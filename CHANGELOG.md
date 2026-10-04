# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-04

First release. Ships the web app, the offline-first desktop app, and the
pipeline that builds and publishes both.

### Added

**Accounts and transactions**

- Accounts with an icon, a currency, a balance and a sidebar group. Six types
  (cash, bank, deposit, brokerage, credit card, crypto wallet) across four
  groups (main accounts, savings, investments, loans and debts).
- Income, expense and transfer transactions with hierarchical categories, dates
  and descriptions. A transfer moves money between two accounts of the same
  user.
- Balance updates run inside the same database transaction as the transaction
  row, so a transfer that fails halfway never debits one side only.
- Cursor pagination on the transaction list plus filtering by account, type and
  date range.
- Soft delete for accounts; archive and restore for categories, cascading to
  their subcategories.
- Per-category colors and icons, picked with a color picker and an icon picker
  and stored as a hex value.

**Analytics**

- Spending and income breakdown as donut charts (Recharts) with a date-range
  filter.
- Aggregation runs on the server: `GET /api/dashboard` returns the profile,
  accounts, categories and both summaries in a single request, so the first
  paint of the dashboard costs one round trip.

**Currencies**

- Sixteen currencies: six fiat (RUB, USD, EUR, GBP, JPY, CNY) and ten crypto
  (BTC, ETH, USDT, USDC, BNB, XRP, SOL, TRX, DOGE, GRAM).
- Rates resolved through six sources tried in order — the Central Bank of
  Russia, Frankfurter, ExchangeRate.host, CoinGecko, Binance and the Fawaz Ahmed
  CDN — so a single provider outage does not break conversions.
- Rates are cached in the database and resynced every three hours. Totals are
  converted to RUB; account balances stay in their own currency.

**Authentication**

- Registration with email verification: a 6-digit code sent over SMTP, valid for
  15 minutes, with a 60-second cooldown between resends.
- Password recovery by email code. The token is consumed in the same transaction
  as the password update, so it cannot be replayed.
- JWT access token (Bearer, 15 minutes) plus a refresh token in an httpOnly,
  SameSite=Lax cookie (7 days), refreshed transparently by axios interceptors.
- Profile editing and account deletion.

**Background jobs**

- BullMQ on Redis: verification emails, password-reset emails and first-login
  seeding run outside the request cycle, so a slow SMTP server cannot stall a
  signup.
- New accounts are seeded with starter categories, two accounts and sample
  transactions, so the dashboard is explorable on the first login.

**Desktop app**

- Tauri 2 wrapper around the same frontend, backed by a local SQLite database,
  so the app is fully usable without the backend.
- Balances are maintained by SQLite triggers on the transaction table. The SQL
  plugin does not expose transactions, so triggers are the only way to keep an
  account and its transactions consistent if the app dies mid-write.
- Single-instance support: a second launch focuses the existing window instead
  of opening a competing pool on the same database file.
- Scoped CSP for the webview, bundled icons and a trimmed permission set.
- Version shown in the desktop sidebar via the Tauri `getVersion()` API.
- Thin LTO with 16 codegen units in the Rust release profile, which keeps the
  bundle inside CI's wall-clock budget without a measurable runtime cost.

**Interface**

- Light and dark themes, a layout that works down to mobile, loading skeletons,
  toasts and modal animations (Framer Motion).
- Optimistic updates through TanStack Query with selective invalidation, so a
  mutation repaints instantly and refetches only what actually changed.

**Infrastructure**

- Full Docker stack — PostgreSQL 17, Redis, backend, frontend, nginx and
  Adminer. The root `compose.yaml` is the entry point and includes
  `deploy/compose.yml`, so build contexts and bind mounts stay relative to the
  repository root; `compose.dev.yml`, `compose.prod.yml` and `compose.ci.yml`
  layer environment-specific overrides on top of it.
- Prisma Next v8 on PostgreSQL 17 as the data layer. The backend entrypoint
  waits for Redis and applies migrations before starting the server.
- Dependencies are installed with bun (`bun.lock`), both locally, in Docker and
  in CI. The runtime stays on Node.js.
- Two-stage production build for the frontend image, with shared BuildKit layer
  caches in CI.
- nginx reverse proxy with two rate-limit layers (30 r/s in general, 5 r/min on
  `/api/auth/*`), a per-IP connection cap and a JSON 429 response.
- Nightly compressed `pg_dump` backups at 03:00 inside the database container,
  keeping the newest 14 dumps and pruning the rest.
- Deploy scripts for macOS/Linux (`deploy/deploy.sh`) and Windows
  (`deploy/deploy.bat`).

**CI/CD and tests**

- The version lives in `desktop/src-tauri/tauri.conf.json` and is propagated to
  `Cargo.toml` and every `package.json` manifest by `npm run version`. CI fails
  when the manifests drift apart or when a tag's number does not match the app
  version.
- CI on `main`, `develop` and `v*` tags: version sync check, backend
  lint/typecheck/tests with a coverage artifact, frontend lint/typecheck/tests,
  and desktop bundles on `main` and on tags.
- Docker integration job that boots the production stack and waits for HTTP 200
  before it passes.
- Release workflow that waits for CI on the tag commit, builds the installers
  through `tauri-action`, then publishes the release instead of leaving it a
  draft.
- Release artifacts: MSI and NSIS on Windows, DMG and `.app` on macOS, AppImage,
  deb and rpm on Linux. CI additionally uploads a portable Windows zip plus
  standalone MSI and DMG bundles.
- Telegram notifications when CI, Docker or the release fails.
- Unit tests for the backend (Jest, with coverage) and the frontend (Vitest),
  plus an e2e suite for the API.

### Security

- Argon2 password hashing.
- Email verification is required before an account can be used.
- The refresh token is stored in an httpOnly cookie, where it is unreachable
  from JavaScript.
- CORS restricted to the configured origins.
- Rate limiting at both layers — nginx and the NestJS throttler, configured
  behind the proxy so it trusts `X-Forwarded-For`.

### Notes

- Licensed under AGPL-3.0.
- The user interface is in Russian; the API and the README are in English.

[Unreleased]: https://github.com/zoom1fy/mymoney/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/zoom1fy/mymoney/releases/tag/v0.1.0