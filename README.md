# MyMoney

- [English](README.md)
- [Русский](README.ru.md)

MyMoney is a full-stack personal finance application with an AI-powered financial advisor. Track income, expenses, and transfers across multiple accounts and currencies, analyze spending with interactive charts, and chat with a local LLM that gives data-backed financial recommendations.

## Features

- **Multi-currency accounts** — bank, cash, savings, crypto, and custom account types with icons
- **Income / expense / transfer tracking** — transactions with hierarchical categories, dates, descriptions
- **Spending analytics** — donut charts (Recharts) with period filtering
- **AI financial advisor** — local Ollama LLM (llama3.1-based) that analyzes your real data and gives concrete, numbers-backed recommendations in Russian
- **Real-time WebSocket chat** — streaming AI responses with message history in DB
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
| Socket.IO Client 4 | Real-time AI chat |
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
| Socket.IO 4 | WebSocket for AI chat |
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
| Ollama | `11434` |

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
│   │   ├── chat/                # WebSocket AI chat + Ollama integration
│   │   │   ├── gateway.ts       # Socket.IO gateway
│   │   │   └── services/        # Analysis intent, period extraction, prompt builder
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
│   │   │   ├── dashboard/       # Sidebar, accounts, categories, transactions, chat
│   │   │   └── dashboard/.../skeletons/  # Loading skeletons
│   │   ├── hooks/               # useProfile, useAccounts, useTransactions, useChat, etc.
│   │   ├── services/            # API clients (auth, account, category, transaction, chat WS)
│   │   ├── types/               # TypeScript interfaces (IAccount, ICategory, etc.)
│   │   ├── config/              # Route constants
│   │   ├── constants/           # SEO metadata
│   │   ├── lib/                 # Utils, formatters, chart helpers
│   │   └── api/                 # Axios interceptors, error helpers
│   └── Dockerfile(.dev/.prod)
├── nginx/
│   └── nginx.conf               # Reverse proxy (frontend + API + Socket.IO)
├── docker-compose.yml           # Full stack (MySQL, backend, frontend, nginx, phpMyAdmin, Ollama)
├── docker-compose.dev.yml       # Dev overrides (ports, volumes)
├── docker-compose.prod.yml      # Prod overrides
├── Modelfile                    # Custom Ollama financial-advisor model definition
├── deploy.sh                    # Deploy script (macOS/Linux)
├── deploy.bat                   # Deploy script (Windows)
└── Insomnia_mymoney.yaml        # API collection for Insomnia
```

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine (Linux)
- Git
- Free ports: `3001`, `3306`, `8080`, `11434`

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
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=financial-advisor
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000 # for prod use 3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api # for prod use 3001
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

First launch downloads `llama3.1` (~4 GB) and creates the custom `financial-advisor` model. This may take a few minutes.

### 3. Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| phpMyAdmin | http://localhost:8080 (user: `root`) |
| Ollama API | http://localhost:11434 |

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

### Chat (`/api/chat`)
| Method | Auth | Description |
|---|---|---|
| GET | JWT | Last 10 messages |
| DELETE | JWT | Clear all messages |

### WebSocket — AI Chat

Connect: `ws://localhost:3001/socket.io` with `auth.token` set to the JWT access token.

| Event | Direction | Payload | Description |
|---|---|---|---|
| `chat:send` | → | `{text, tempId?}` | Send a message |
| `chat:message` | ← | `{id, content, role, createdAt}` | Saved user message |
| `chat:partial` | ← | `{id, chunk}` | Streaming response chunk |
| `chat:complete` | ← | `{id, finalId, response}` | Final response |
| `chat:error` | ← | `{error, tempId?}` | Error |

## AI Financial Advisor

- **Model:** `financial-advisor` (custom, based on `llama3.1` via Ollama)
- **Language:** Russian only
- **Triggers:** Keywords like *анализ, расход, доход, отчет, финанс, оптимиз, сводка, статист, эконом, бюджет*
- **Data sent:** Full financial summary (income/expense by category, monthly breakdown, account balances, savings rate)
- **Period extraction:** Natural language → date ranges ("за прошлый месяц", "последние 30 дней", "с 1 марта по 17 апреля")
- **Streaming:** Responses streamed via WebSocket in real-time chunks

**What it does:**
- Identifies top spending categories and their proportions
- Flags growing expense categories and unusual patterns
- Gives specific, numbers-backed recommendations (exact amounts to cut, limits to set)

**What it does NOT do:**
- Never invents data not in your records
- Does not give investment advice
- Runs entirely locally — no data leaves your machine

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
docker compose down -v   # Reset DB + Ollama data
```

## Database

| Entity | Description |
|---|---|
| **User** | UUID, email, Argon2 hash |
| **Account** | Linked to user, type, category, currency; DECIMAL(15,2) balance |
| **Category** | Hierarchical (self-referencing), scoped to user, income/expense flag |
| **Transaction** | INCOME / EXPENSE / TRANSFER, updates balances atomically |
| **Currency** | RUB, USD, EUR, BTC |
| **ChatMessage** | UUID, user link, role (USER/ASSISTANT), content |

All values use `DECIMAL(15,2)`. Collation: `utf8mb4_unicode_ci`.

## Security

- **Argon2** password hashing (not bcrypt)
- **JWT** access (15m) + refresh (7d) token pair
- **Refresh token** in httpOnly, SameSite=Lax cookie (XSS-resistant)
- **Soft-delete** for accounts (`isDeleted`) and categories (`isArchived`)
- **CORS** restricted to frontend origin

## Notes

- UI is in Russian; the AI advisor responds only in Russian
- Currency exchange rates fetched from the Central Bank of Russia (CBR) API
- All financial math uses `Decimal.js` — no floating-point precision issues
