# MyMoney

- [English](README.md)
- [Русский](README.ru.md)

MyMoney is a personal finance management application with an AI-powered financial advisor. Track income, expenses, transfers across multiple accounts and currencies, analyze spending patterns with visual charts, and get personalized budget recommendations from a built-in LLM.

## Features

- **Multi-currency accounts** — bank accounts, cash, and custom account types with icons and balances
- **Income & expense tracking** — transactions with categories, dates, descriptions, and multi-currency support
- **Hierarchical categories** — nested income/expense categories with custom colors and icons
- **Transfers between accounts** — move money between your accounts
- **Visual dashboard** — spending analytics with charts (Recharts) and period filtering
- **AI financial advisor** — chat with a local LLM (Ollama + llama3.1) that analyzes your real financial data and gives concrete, numbers-backed recommendations
- **Real-time chat** — WebSocket-powered AI conversation with message history stored in the database
- **JWT authentication** — secure login with access/refresh tokens stored in httpOnly cookies

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [Next.js 15](https://nextjs.org/) (App Router) | React framework |
| React 19 | UI library |
| Tailwind CSS 4 + shadcn/ui | Styling & component primitives |
| Ant Design 6 | Additional UI components |
| Recharts 3 | Data visualization (charts) |
| TanStack Query 5 | Server state management |
| React Hook Form 7 | Form handling |
| Socket.IO Client 4 | Real-time AI chat |
| Framer Motion 12 | Animations |
| Sonner | Toast notifications |
| Day.js / date-fns | Date manipulation |

### Backend
| Technology | Purpose |
|---|---|
| [NestJS 11](https://nestjs.com/) | Node.js framework |
| Prisma 6 | ORM & database migrations |
| MySQL 8.0 | Relational database |
| JWT + Passport | Authentication |
| Argon2 | Password hashing |
| Socket.IO 4 | WebSocket server for AI chat |
| Axios | HTTP client (Ollama API integration) |
| Decimal.js | Precise financial calculations |
| Cache Manager | Response caching |

### Infrastructure
| Service | Port |
|---|---|
| Frontend (Next.js) | `3001` |
| Backend (NestJS API) | `3000` |
| MySQL 8.0 | `3306` |
| phpMyAdmin | `8080` |
| Ollama (LLM) | `11434` |

## Project Structure

```
mymoney/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── auth/            # JWT authentication (login, register, refresh)
│   │   ├── user/            # User management
│   │   ├── account/         # Account CRUD (bank, cash, etc.)
│   │   ├── category/        # Income/expense categories (hierarchical)
│   │   ├── transaction/     # Transactions (income, expense, transfer)
│   │   ├── dashboard/       # Analytics & aggregated financial data
│   │   ├── chat/            # AI chat via WebSocket + Ollama
│   │   ├── currency/        # Currency reference data
│   │   ├── common/          # Shared utilities, guards, pipes
│   │   ├── config/          # App configuration
│   │   └── prisma/          # Prisma service
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Initial data (currencies, account types)
│   └── Dockerfile
├── frontend/                # Next.js web application
│   ├── src/
│   │   ├── app/             # App Router pages (auth, dashboard)
│   │   ├── components/      # React UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client services
│   │   ├── types/           # TypeScript type definitions
│   │   └── api/             # API route handlers
│   └── Dockerfile
├── docker-compose.yml       # Full stack orchestration
├── Modelfile                # Custom Ollama financial advisor model
├── deploy.sh                # Deploy script (macOS/Linux)
└── deploy.bat               # Deploy script (Windows)
```

## Requirements

- **Docker** — [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine (Linux)
- **Git** — for cloning the repository
- **Free ports**: `3000`, `3001`, `3306`, `8080`, `11434`

Node.js (18+) is optional — everything runs inside Docker containers.

## Quick Start

### 1. Clone the repository

```bash
git clone <repository_URL>
cd mymoney
```

### 2. Configure environment variables

**Root `.env`** (copy from `.example.env`):

```bash
cp .example.env .env
```

Edit `.env` and set your values:

```env
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
MYSQL_DATABASE=mymoneydb
DATABASE_URL=mysql://your_db_user:your_db_password@db:3306/mymoneydb
NESTJS_PORT=3000
NEXTJS_PORT=3001
JWT_SECRET=your-super-secret-key-change-this
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_COOKIE_NAME=refresh_token
NODE_ENV=development
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=financial-advisor
```

### 3. Start the project

**macOS / Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```bat
deploy.bat
```

The script stops old containers, builds images, and starts the full stack.

### 4. Verify

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| phpMyAdmin | http://localhost:8080 (login: `root` / your `MYSQL_ROOT_PASSWORD`) |
| Ollama API | http://localhost:11434 |

The first launch will download the `llama3.1` model (~4 GB) for the AI advisor. This may take a few minutes depending on your connection.

## Development

### Backend (NestJS)

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Seed the database
npm run prisma:seed

# Start in dev mode (watch)
npm run start:dev

# Run tests
npm run test
npm run test:e2e

# Lint
npm run lint
```

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

### Docker (full stack)

```bash
# Start everything
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v
```

## Database Schema

The application uses the following core entities:

- **User** — registered users (UUID, email, password hash)
- **Account** — financial accounts (bank, cash, etc.) with type, category, currency, and icon
- **Category** — income/expense categories with optional parent-child hierarchy, custom colors
- **Transaction** — financial operations (INCOME / EXPENSE / TRANSFER) with amount, date, description
- **Currency** — supported currencies (RUB, USD, EUR, BTC)
- **ChatMessage** — AI chat history (user messages and assistant responses)

All monetary values use `DECIMAL(15, 2)` for precision.

## AI Financial Advisor

The project includes a local AI assistant powered by [Ollama](https://ollama.com) running a custom `financial-advisor` model based on `llama3.1`.

**What it does:**
- Analyzes your real income, expenses, categories, and date ranges
- Identifies top spending categories and their proportions
- Flags growing expense categories and unusual spending patterns
- Gives specific, numbers-backed recommendations (exact amounts to cut, limits to set)
- Responds **only in Russian** with concise, emoji-friendly answers

**What it doesn't do:**
- It never invents transactions, amounts, or categories that aren't in your data
- It doesn't give investment advice
- It runs entirely locally — no data leaves your machine

The model is defined in the `Modelfile` at the project root and is automatically created on first launch.

## Notes

- Russian language support is built-in (`utf8mb4_unicode_ci` collation)
- The AI advisor responds only in Russian by design
- All financial calculations use `Decimal.js` for precision (no floating-point issues)
- Passwords are hashed with Argon2 (not bcrypt)
- Refresh tokens are stored in httpOnly cookies (XSS-resistant)
