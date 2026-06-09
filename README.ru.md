# MyMoney

- [English](README.md)
- [Русский](README.ru.md)

MyMoney — полнофункциональное приложение для управления личными финансами со встроенным AI-финансовым консультантом. Отслеживайте доходы, расходы и переводы между счетами в разных валютах, анализируйте траты с помощью интерактивных графиков и общайтесь с локальной нейросетью, которая даёт рекомендации на основе ваших реальных данных.

## Возможности

- **Мультивалютные счета** — банковские, наличные, сберегательные, крипто и пользовательские типы с иконками
- **Учёт доходов / расходов / переводов** — транзакции с иерархическими категориями, датами и описаниями
- **Аналитика трат** — круговые диаграммы (Recharts) с фильтрацией по периодам
- **AI-финансовый консультант** — локальная LLM (Ollama, llama3.1) анализирует реальные данные и даёт конкретные рекомендации с цифрами на русском языке
- **Чат в реальном времени** — WebSocket со стримингом ответов AI, история сохраняется в БД
- **JWT-аутентификация** — access-токены (Bearer) + refresh-токены (httpOnly cookies)
- **Оптимистичный UI** — мгновенные обновления через TanStack Query

## Технологический стек

### Фронтенд
| Технология | Назначение |
|---|---|
| [Next.js 15](https://nextjs.org/) (App Router) | React-фреймворк |
| React 19 | UI-библиотека |
| Tailwind CSS 4 + shadcn/ui (New York) | Стилизация и примитивы |
| Ant Design 6 | DatePicker и доп. компоненты |
| Recharts 3 | Круговые диаграммы |
| TanStack Query 5 | Серверное состояние и оптимистичные обновления |
| Socket.IO Client 4 | AI-чат в реальном времени |
| Framer Motion 12 | Анимации |
| React Hook Form 7 | Формы |
| Sonner | Toast-уведомления |

### Бэкенд
| Технология | Назначение |
|---|---|
| [NestJS 11](https://nestjs.com/) | Node.js-фреймворк |
| Prisma 6 | ORM и миграции |
| MySQL 8.0 | База данных |
| JWT + Passport | Аутентификация |
| Argon2 | Хеширование паролей |
| Socket.IO 4 | WebSocket для AI-чата |
| Decimal.js | Точные финансовые расчёты |
| Cache Manager | Кеширование |

### Инфраструктура
| Сервис | Внутренний : Внешний порт |
|---|---|
| Frontend (Next.js) | `3000` → `3001` (через nginx) |
| Backend (NestJS) | `3000` (внутренний) |
| nginx | `80` → `3001` |
| MySQL 8.0 | `3306` |
| phpMyAdmin | `80` → `8080` |
| Ollama | `11434` |

## Структура проекта

```
mymoney/
├── backend/                     # NestJS API-сервер
│   ├── src/
│   │   ├── auth/                # JWT: логин, регистрация, refresh, guards
│   │   ├── user/                # CRUD профиля
│   │   ├── account/             # CRUD счетов (банк, наличные и т.д.)
│   │   ├── category/            # Иерархические категории доходов/расходов
│   │   ├── transaction/         # Доходы / расходы / переводы
│   │   ├── chat/                # WebSocket AI-чат + интеграция с Ollama
│   │   │   ├── gateway.ts       # Socket.IO gateway
│   │   │   └── services/        # Анализ намерений, извлечение периода, сборка промпта
│   │   ├── currency/            # Курсы валют через API ЦБ РФ
│   │   ├── prisma/              # Prisma-сервис
│   │   ├── config/              # JWT-конфиг, токен-конфиг
│   │   └── common/enums/        # Общие перечисления (CurrencyCode)
│   ├── prisma/
│   │   ├── schema.prisma        # Схема БД
│   │   ├── seed.ts              # Валюты, типы счетов
│   │   └── migrations/          # Миграции Prisma
│   ├── test/                    # E2E-тесты
│   └── Dockerfile(.dev/.prod)
├── frontend/                    # Next.js веб-приложение
│   ├── src/
│   │   ├── app/                 # App Router: auth, dashboard (me/)
│   │   ├── components/          # UI-примитивы + компоненты дашборда
│   │   │   ├── ui/              # shadcn/ui, кнопки, карточки, модалки
│   │   │   ├── dashboard/       # Sidebar, счета, категории, транзакции, чат
│   │   │   └── dashboard/.../skeletons/  # Скелетоны загрузки
│   │   ├── hooks/               # useProfile, useAccounts, useTransactions, useChat и др.
│   │   ├── services/            # API-клиенты (auth, account, category, transaction, chat WS)
│   │   ├── types/               # TypeScript-интерфейсы (IAccount, ICategory, ...)
│   │   ├── config/              # Константы маршрутов
│   │   ├── constants/           # SEO-метаданные
│   │   ├── lib/                 # Утилиты, форматтеры, helpers для графиков
│   │   └── api/                 # Axios-интерсепторы, обработка ошибок
│   └── Dockerfile(.dev/.prod)
├── nginx/
│   └── nginx.conf               # Обратный прокси (frontend + API + Socket.IO)
├── docker-compose.yml           # Весь стек (MySQL, backend, frontend, nginx, phpMyAdmin, Ollama)
├── docker-compose.dev.yml       # Dev-расширения (порты, volumes)
├── docker-compose.prod.yml      # Prod-расширения
├── Modelfile                    # Кастомная модель Ollama financial-advisor
├── deploy.sh                    # Скрипт деплоя (macOS/Linux)
├── deploy.bat                   # Скрипт деплоя (Windows)
└── Insomnia_mymoney.yaml        # Коллекция API-запросов для Insomnia
```

## Быстрый старт

### Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) или Docker Engine (Linux)
- Git
- Свободные порты: `3001`, `3306`, `8080`, `11434`

### 1. Клонируйте и настройте

```bash
git clone <url_репозитория>
cd mymoney
cp .example.env .env
```

Отредактируйте `.env`:

```env
MYSQL_ROOT_PASSWORD=ваш_пароль
MYSQL_DATABASE=mymoneydb
DATABASE_URL=mysql://root:ваш_пароль@db:3306/mymoneydb
JWT_SECRET=ваш-секретный-ключ
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=financial-advisor
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000 # для prod используйте 3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api # для prod используйте 3001
```

### 2. Запустите

```bash
# macOS / Linux
./deploy.sh

# Windows
deploy.bat
```

Или вручную:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

При первом запуске скачается модель `llama3.1` (~4 ГБ) и создастся кастомная модель `financial-advisor`. Это может занять несколько минут.

### 3. Откройте в браузере

| Сервис | URL |
|---|---|
| Фронтенд | http://localhost:3001 |
| phpMyAdmin | http://localhost:8080 (пользователь: `root`) |
| Ollama API | http://localhost:11434 |

## API-справочник

### Аутентификация (`/api/auth`)
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| POST | `/api/auth/register` | — | Регистрация `{email, password}` |
| POST | `/api/auth/login` | — | Вход `{email, password}` |
| POST | `/api/auth/login/access-token` | Cookie | Обновление access-токена |
| POST | `/api/auth/logout` | — | Удаление refresh-куки |

Ответ: `{ user: {id, email}, accessToken }` + `refresh_token` httpOnly cookie.

### Пользователь (`/api/user/profile`)
| Метод | Auth | Описание |
|---|---|---|
| GET | JWT | Получить профиль |
| PATCH | JWT | Обновить email / пароль |
| DELETE | JWT | Удалить аккаунт |

### Счета (`/api/accounts`)
| Метод | Auth | Описание |
|---|---|---|
| POST | JWT | Создать счёт |
| GET | JWT | Список активных |
| GET `/:id` | JWT | Получить по ID |
| PATCH `/:id` | JWT | Обновить |
| DELETE `/:id` | JWT | Мягкое удаление |

### Категории (`/api/category`)
| Метод | Auth | Описание |
|---|---|---|
| POST | JWT | Создать категорию |
| GET | JWT | Активные категории |
| GET `/:id` | JWT | По ID |
| PATCH `/:id` | JWT | Обновить |
| DELETE `/:id` | JWT | Архивация (с подкатегориями) |
| GET `/archived` | JWT | Архивные категории |
| PATCH `/:id/unarchive` | JWT | Восстановить |

### Транзакции (`/api/transactions`)
| Метод | Auth | Описание |
|---|---|---|
| POST | JWT | Создать (INCOME / EXPENSE / TRANSFER) |
| GET | JWT | Список с пагинацией и фильтрами |
| GET `/:id` | JWT | По ID |
| PATCH `/:id` | JWT | Обновить (rollback + apply) |
| DELETE `/:id` | JWT | Удалить (обратный баланс) |

**Фильтры:** `take`, `cursor`, `accountId`, `type`, `from`, `to`

### Чат (`/api/chat`)
| Метод | Auth | Описание |
|---|---|---|
| GET | JWT | Последние 10 сообщений |
| DELETE | JWT | Очистить историю |

### WebSocket — AI-чат

Подключение: `ws://localhost:3001/socket.io` с `auth.token` = JWT access-токен.

| Событие | Направление | Данные | Описание |
|---|---|---|---|
| `chat:send` | → | `{text, tempId?}` | Отправить сообщение |
| `chat:message` | ← | `{id, content, role, createdAt}` | Сохранённое сообщение |
| `chat:partial` | ← | `{id, chunk}` | Чанк стриминга ответа |
| `chat:complete` | ← | `{id, finalId, response}` | Полный ответ |
| `chat:error` | ← | `{error, tempId?}` | Ошибка |

## AI-финансовый консультант

- **Модель:** `financial-advisor` (кастомная, на базе `llama3.1` через Ollama)
- **Язык:** только русский
- **Триггер:** ключевые слова *анализ, расход, доход, отчет, финанс, оптимиз, сводка, статист, эконом, бюджет*
- **Данные:** полная финансовая сводка (доходы/расходы по категориям, помесячная разбивка, балансы счетов, норма сбережения)
- **Извлечение периода** из естественного языка: "за прошлый месяц", "последние 30 дней", "с 1 марта по 17 апреля"
- **Стриминг:** ответ передаётся по WebSocket чанками в реальном времени

**Что умеет:**
- Определяет топ категорий расходов и их долю
- Выявляет растущие категории и необычные паттерны
- Даёт конкретные рекомендации с цифрами (сколько сократить, какой лимит установить)

**Что НЕ делает:**
- Никогда не придумывает данные, которых нет в ваших записях
- Не даёт инвестиционных советов
- Работает полностью локально — данные не покидают ваш компьютер

## Разработка

### Бэкенд
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev

# Тесты (66+ unit-тестов)
npm run test          # Unit
npm run test:cov      # С покрытием
npm run test:e2e      # E2E
npm run lint
```

### Фронтенд
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
docker compose down -v   # Сброс БД + данных Ollama
```

## База данных

| Сущность | Описание |
|---|---|
| **User** | UUID, email, хеш Argon2 |
| **Account** | Привязан к пользователю, типу, категории, валюте; баланс DECIMAL(15,2) |
| **Category** | Иерархическая (самоссылающаяся), в рамках пользователя, флаг дохода/расхода |
| **Transaction** | INCOME / EXPENSE / TRANSFER, атомарное обновление баланса |
| **Currency** | RUB, USD, EUR, BTC |
| **ChatMessage** | UUID, связь с пользователем, роль (USER/ASSISTANT), содержимое |

Все суммы — `DECIMAL(15,2)`. Кодировка: `utf8mb4_unicode_ci`.

## Безопасность

- **Argon2** для хеширования паролей (не bcrypt)
- **JWT** пара: access (15 мин) + refresh (7 дней)
- **Refresh-токен** в httpOnly, SameSite=Lax cookie (защита от XSS)
- **Мягкое удаление** для счетов (`isDeleted`) и категорий (`isArchived`)
- **CORS** ограничен origin фронтенда

## Примечания

- Интерфейс на русском языке; AI-консультант отвечает только на русском
- Курсы валют загружаются через API Центрального Банка России (ЦБ РФ)
- Все финансовые расчёты через `Decimal.js` — никаких проблем с плавающей точкой
