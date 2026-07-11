# MyMoney

- [English](README.md)
- [Русский](README.ru.md)

MyMoney is a full-stack personal finance application. Track income, expenses, and transfers across multiple accounts and currencies, analyze spending with interactive charts.

## Features

- **Multi-currency accounts** — bank, cash, savings, crypto, and custom account types with icons
- **Income / expense / transfer tracking** — transactions with hierarchical categories, dates, descriptions
- **Spending analytics** — donut charts (Recharts) with period filtering

- **JWT authentication** — access tokens (Bearer) + refresh tokens (httpOnly cookies)
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
| Prisma 6 | ORM & migrations |
| MySQL 8.0 | Database |
| JWT + Passport | Authentication |
| Argon2 | Password hashing |

| Decimal.js | Precise financial math |
| Cache Manager | Response caching |

### Infrastructure
| Service | Internal : External |
|---|---|
| Frontend (Next.js) | `3000` → `3001` (via nginx) |
| Backend (NestJS) | `3000` (internal) |
| nginx | `80` → `3001` |
| MySQL 8.0 | `3306` |
| phpMyAdmin | `80` → `8080` |


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
├── docker-compose.yml           # Full stack (MySQL, backend, frontend, nginx, phpMyAdmin)
├── docker-compose.dev.yml       # Dev overrides (ports, volumes)
├── docker-compose.prod.yml      # Prod overrides

├── deploy.sh                    # Deploy script (macOS/Linux)
├── deploy.bat                   # Deploy script (Windows)
└── Insomnia_mymoney.yaml        # API collection for Insomnia
```

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine (Linux)
- Git
- Free ports: `3001`, `3306`, `8080`

### 1. Clone and configure

```bash
git clone <repository_url>
cd mymoney
cp .example.env .env
```

Edit `.env`:

```env
MYSQL_ROOT_PASSWORD=your_pass
MYSQL_DATABASE=mymoneydb
DATABASE_URL=mysql://root:your_pass@db:3306/mymoneydb
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_COOKIE_DOMAIN=localhost
```

### 2. Start

```bash
# macOS / Linux
./deploy.sh

# Windows
deploy.bat
```

Or manually:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```



### 3. Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| phpMyAdmin | http://localhost:8080 (user: `root`) |


## API Reference

### Authentication (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register `{email, password}` |
| POST | `/api/auth/login` | — | Login `{email, password}` |
| POST | `/api/auth/login/access-token` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | — | Clear refresh token |

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

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev

# Tests (66+ unit tests)
npm run test          # Unit
npm run test:cov      # With coverage
npm run test:e2e      # E2E
npm run lint
```

### Frontend
```bash
cd frontend
npm install
npm run dev
npm run lint
```

### Docker
```bash
docker compose up -d --build
docker compose logs -f backend
docker compose down
docker compose down -v   # Reset DB
```

## Database

| Entity | Description |
|---|---|
| **User** | UUID, email, Argon2 hash |
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

## Notes

- UI is in Russian
- Currency exchange rates fetched from the Central Bank of Russia (CBR) API
- All financial math uses `Decimal.js` — no floating-point precision issues
