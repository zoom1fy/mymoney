# MyMoney

- [English](README.md)
- [Русский](README.ru.md)

MyMoney — полнофункциональное приложение для управления личными финансами. Отслеживайте доходы, расходы и переводы между счетами в разных валютах, анализируйте траты с помощью интерактивных графиков.

## Возможности

- **Мультивалютные счета** — банковские, наличные, сберегательные, крипто и пользовательские типы с иконками
- **Учёт доходов / расходов / переводов** — транзакции с иерархическими категориями, датами и описаниями
- **Аналитика трат** — круговые диаграммы (Recharts) с фильтрацией по периодам

- **JWT-аутентификация** — access-токены (Bearer) + refresh-токены (httpOnly cookies)
- **Email-верификация** — 6-значный код через SMTP (Яндекс), повтор через 60с, срок 15 мин
- **Восстановление пароля** — забыли пароль? Код на почту, сброс
- **Ограничение запросов** — nginx (30 запр/с общее, 5 запр/мин auth) + NestJS ThrottlerModule
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

| Nodemailer | SMTP-отправка писем |
| @nestjs/throttler | Ограничение запросов (за nginx) |

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
│   │   │   ├── dashboard/       # Sidebar, счета, категории, транзакции
│   │   │   └── dashboard/.../skeletons/  # Скелетоны загрузки
│   │   ├── hooks/               # useProfile, useAccounts, useTransactions и др.
│   │   ├── services/            # API-клиенты (auth, account, category, transaction)
│   │   ├── types/               # TypeScript-интерфейсы (IAccount, ICategory, ...)
│   │   ├── config/              # Константы маршрутов
│   │   ├── constants/           # SEO-метаданные
│   │   ├── lib/                 # Утилиты, форматтеры, helpers для графиков
│   │   └── api/                 # Axios-интерсепторы, обработка ошибок
│   └── Dockerfile(.dev/.prod)
├── nginx/
│   └── nginx.conf               # Обратный прокси (frontend + API)
├── docker-compose.yml           # Весь стек (MySQL, backend, frontend, nginx, phpMyAdmin)
├── docker-compose.dev.yml       # Dev-расширения (порты, volumes)
├── docker-compose.prod.yml      # Prod-расширения

├── deploy.sh                    # Скрипт деплоя (macOS/Linux)
├── deploy.bat                   # Скрипт деплоя (Windows)
└── Insomnia_mymoney.yaml        # Коллекция API-запросов для Insomnia
```

## Быстрый старт

### Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) или Docker Engine (Linux)
- Git
- Свободные порты: `3001`, `3306`, `8080`

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
CORS_ORIGINS=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_COOKIE_DOMAIN=localhost

# SMTP (для верификации email и восстановления пароля)
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=your-email@yandex.ru
SMTP_PASS=your-app-password
SMTP_FROM=your-email@yandex.ru
SMTP_TLS=true
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



### 3. Откройте в браузере

| Сервис | URL |
|---|---|
| Фронтенд | http://localhost:3001 |
| phpMyAdmin | http://localhost:8080 (пользователь: `root`) |


## API-справочник

### Аутентификация (`/api/auth`)
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| POST | `/api/auth/register` | — | Регистрация `{email, password}` → `{email}` |
| POST | `/api/auth/verify-email` | — | Подтвердить код `{email, code}` → токены |
| POST | `/api/auth/resend-code` | — | Отправить код заново `{email}` (60с кулдаун) |
| POST | `/api/auth/forgot-password` | — | Запросить сброс пароля `{email}` |
| POST | `/api/auth/reset-password` | — | Сбросить пароль `{email, code, password}` |
| POST | `/api/auth/login` | — | Вход `{email, password}` |
| POST | `/api/auth/login/access-token` | Cookie | Обновление access-токена |
| POST | `/api/auth/logout` | — | Удаление refresh-куки |

Все auth-эндпоинты ограничены — **5 запросов в минуту на IP** (nginx + NestJS).

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
docker compose down -v   # Сброс БД
```

## База данных

| Сущность | Описание |
|---|---|---|
| **User** | UUID, email, хеш Argon2 |
| **PendingUser** | Неподтверждённая регистрация (удаляется после верификации email) |
| **PasswordResetToken** | 6-значный код с expiry для восстановления пароля |
| **Account** | Привязан к пользователю, типу, категории, валюте; баланс DECIMAL(15,2) |
| **Category** | Иерархическая (самоссылающаяся), в рамках пользователя, флаг дохода/расхода |
| **Transaction** | INCOME / EXPENSE / TRANSFER, атомарное обновление баланса |
| **Currency** | RUB, USD, EUR, BTC |


Все суммы — `DECIMAL(15,2)`. Кодировка: `utf8mb4_unicode_ci`.

## Безопасность

- **Argon2** для хеширования паролей (не bcrypt)
- **JWT** пара: access (15 мин) + refresh (7 дней)
- **Refresh-токен** в httpOnly, SameSite=Lax cookie (защита от XSS)
- **Мягкое удаление** для счетов (`isDeleted`) и категорий (`isArchived`)
- **CORS** ограничен origin фронтенда
- **Ограничение запросов** двойной слой (nginx + NestJS) против brute-force и DDoS
- **Email-верификация** обязательна перед активацией аккаунта
- **60-секундный кулдаун** между повторными отправками кода

## Примечания

- Интерфейс на русском языке
- Курсы валют загружаются через API Центрального Банка России (ЦБ РФ)
- Все финансовые расчёты через `Decimal.js` — никаких проблем с плавающей точкой
