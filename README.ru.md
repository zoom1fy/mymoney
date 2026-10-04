# MyMoney

- [English](README.md)
- [Русский](README.ru.md)

MyMoney — полнофункциональное приложение для управления личными финансами. Отслеживайте доходы, расходы и переводы между счетами в разных валютах, анализируйте траты с помощью интерактивных графиков. Поставляется как веб-приложение и как десктопное приложение, работающее офлайн.

## Возможности

- **Мультивалютные счета** — 6 типов (наличные, банковский счет, депозит, брокерский, кредитная карта, криптокошелек) в 4 группах сайдбара, у каждого своя иконка
- **Учёт доходов / расходов / переводов** — транзакции с иерархическими категориями, цветами, иконками, датами и описаниями
- **Аналитика трат** — круговые диаграммы (Recharts) с фильтрацией по периоду, агрегация на сервере
- **Дашборд за один запрос** — `GET /api/dashboard` отдаёт профиль, счета, категории и обе сводки сразу

- **JWT-аутентификация** — access-токены (Bearer) + refresh-токены (httpOnly cookies)
- **Email-верификация** — 6-значный код через SMTP (Яндекс), повтор через 60с, срок 15 мин
- **Восстановление пароля** — забыли пароль? Код на почту, сброс; код одноразовый
- **Фоновые задачи** — BullMQ + Redis на отправку писем и подготовку данных нового аккаунта
- **Ограничение запросов** — nginx (30 запр/с общее, 5 запр/мин auth) + NestJS ThrottlerModule
- **Оптимистичный UI** — мгновенные обновления через TanStack Query

- **Десктопное приложение** — Tauri 2 с локальной базой SQLite, полностью работоспособно без бэкенда
- **Ежедневные бэкапы** — сжатый `pg_dump` внутри контейнера с БД с ротацией файлов
- **Светлая и тёмная темы** — вёрстка работает и на мобильном, есть скелетоны загрузки

## Технологический стек

### Фронтенд
| Технология | Назначение |
|---|---|
| [Next.js 15](https://nextjs.org/) (App Router) | React-фреймворк |
| React 19 | UI-библиотека |
| Tailwind CSS 4 + shadcn/ui (New York) | Стилизация и примитивы |
| Recharts 3 | Круговые диаграммы |
| TanStack Query 5 | Серверное состояние и оптимистичные обновления |
| Framer Motion 12 | Анимации |
| React Hook Form 7 | Формы |
| Sonner | Toast-уведомления |
| next-themes | Светлая / тёмная тема |
| lucide-react | Иконки |
| react-day-picker + date-fns | Календарь и работа с датами |
| react-number-format | Поля ввода сумм |
| react-colorful | Палитра для цвета категории |
| @tauri-apps/api + plugin-sql / plugin-http | Мост к десктопному приложению |

### Бэкенд
| Технология | Назначение |
|---|---|
| [NestJS 11](https://nestjs.com/) | Node.js-фреймворк |
| Prisma Next (v8) | ORM и миграции |
| PostgreSQL 17 | База данных |
| Redis 7 + BullMQ | Фоновые задачи |
| JWT + Passport | Аутентификация |
| Argon2 | Хеширование паролей |
| Nodemailer | SMTP-отправка писем |
| @nestjs/throttler | Ограничение запросов (за nginx) |
| @nestjs/axios | Исходящие HTTP-запросы за курсами валют |

### Десктоп
| Технология | Назначение |
|---|---|
| [Tauri 2](https://tauri.app/) | Оболочка десктопного приложения |
| Rust + SQLx | Доступ к SQLite и миграции |
| tauri-plugin-sql | SQLite из webview |
| tauri-plugin-http | HTTP-запросы из webview |
| tauri-plugin-single-instance | Одно окно на одну установку |

### Инфраструктура
| Сервис | Внутренний : Внешний порт |
|---|---|
| Frontend (Next.js) | `3000` → `3001` (через nginx) |
| Backend (NestJS) | `3000` (внутренний) |
| nginx | `80` → `3001` |
| PostgreSQL 17 | `5432` |
| Redis 7 | `6379` |
| Adminer | `80` → `8080` |


## Структура проекта

```
mymoney/
├── .github/workflows/           # ci.yml, docker.yml, release.yml
├── backend/                     # NestJS API-сервер
│   ├── src/
│   │   ├── auth/                # регистрация, вход, refresh, верификация email, сброс пароля
│   │   ├── user/                # CRUD профиля
│   │   ├── account/             # CRUD счетов, типы и группы счетов
│   │   ├── category/            # Иерархические категории доходов/расходов, архивация
│   │   ├── transaction/         # Доходы / расходы / переводы и сводки
│   │   ├── dashboard/           # Единая агрегированная ручка дашборда
│   │   ├── currency/            # Список валют и курсы с fallback-источниками
│   │   ├── queue/               # Задачи BullMQ: письма, сидинг нового пользователя
│   │   ├── mail/                # Отправка SMTP через Nodemailer
│   │   ├── seed/                # Стартовые данные для новых аккаунтов
│   │   ├── prisma/              # Prisma-клиент и контракт схемы contract.prisma
│   │   ├── config/              # JWT-конфиг, токен-конфиг
│   │   └── common/              # Общие перечисления, guard с учётом прокси
│   ├── migrations/              # Миграции prisma-next
│   ├── test/                    # E2E-тесты и моки ORM
│   ├── prisma-next.config.ts
│   └── Dockerfile.dev / Dockerfile.prod
├── frontend/                    # Next.js веб-приложение
│   ├── src/
│   │   ├── app/                 # App Router: auth, дашборд (me/)
│   │   ├── components/
│   │   │   ├── ui/              # Примитивы shadcn/ui, кнопки, модалки, пикеры
│   │   │   └── dashboard/       # Сайдбар, счета, категории, транзакции, профиль
│   │   ├── hooks/               # use-accounts, use-categories, use-transactions, ...
│   │   ├── services/            # HTTP-клиенты + адаптеры local/* для десктопа
│   │   ├── types/               # TypeScript-интерфейсы
│   │   ├── lib/                 # Форматтеры, helpers для графиков, определение платформы
│   │   ├── api/                 # Интерсепторы axios, обработка ошибок
│   │   └── middleware.ts
│   ├── scripts/                 # Хелперы для dev/build десктопа
│   └── Dockerfile.dev / Dockerfile.prod
├── desktop/                     # Приложение на Tauri 2
│   ├── src-tauri/
│   │   ├── src/                 # Rust: плагины, миграции SQLite при старте
│   │   ├── migrations/          # Схема SQLite, сидинг, курсы, триггеры балансов
│   │   ├── capabilities/        # Права Tauri
│   │   ├── tauri.conf.json      # Единственный источник версии
│   │   └── Cargo.toml
│   └── scripts/                 # Обёртки tauri.mjs / fe.mjs
├── db/                          # Образ PostgreSQL с cron для ночных бэкапов
├── deploy/                      # Compose-оверрайды и скрипты деплоя
│   ├── compose.yml              # Весь стек (PostgreSQL, Redis, backend, frontend, nginx, Adminer)
│   ├── compose.dev.yml          # Dev-расширения (Dockerfile, порты, volumes)
│   ├── compose.prod.yml         # Prod-расширения
│   ├── compose.ci.yml           # BuildKit-кэш слоёв только для CI
│   ├── deploy.sh                # Скрипт деплоя (macOS/Linux)
│   └── deploy.bat               # Скрипт деплоя (Windows)
├── nginx/
│   └── nginx.conf               # Обратный прокси и лимиты запросов (frontend + API)
├── scripts/app-version.mjs      # Расставляет версию по всем манифестам
├── backups/                     # Локальный каталог для pg_dump (в git не попадает)
├── compose.yaml                 # Точка входа Compose (подключает deploy/compose.yml)
└── package.json                 # Корневой раннер задач: bun run dev:backend / dev:frontend / dev:desktop
```

## Быстрый старт

### Требования

- [Docker Desktop](https://www.docker.com/desktop/) (Windows/macOS) или Docker Engine (Linux)
- [Bun](https://bun.sh/) — для запуска корневых скриптов
- Git
- Свободные порты: `3001`, `5432`, `6379`, `8080`

### 1. Клонируйте и настройте

```bash
git clone <url_репозитория>
cd mymoney
cp .example.env .env
```

Отредактируйте `.env`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ваш_пароль
POSTGRES_DB=mymoneydb
DATABASE_URL=postgresql://postgres:ваш_пароль@db:5432/mymoneydb
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

# Необязательно — ниже те значения, которые Compose и бэкенд уже подставляют по умолчанию
REDIS_HOST=redis
REDIS_PORT=6379
BACKUP_KEEP=14
```

### 2. Запустите

```bash
# macOS / Linux
./deploy/deploy.sh

# Windows
deploy\deploy.bat
```

Или вручную:

```bash
bun run docker:up
```



### 3. Откройте в браузере

| Сервис | URL |
|---|---|
| Фронтенд | http://localhost:3001 |
| Adminer | http://localhost:8080 |


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

### Дашборд (`/api/dashboard`)
| Метод | Auth | Описание |
|---|---|---|
| GET | JWT | Профиль, счета, категории и сводки по доходам и расходам одним ответом |

**Параметры:** `from`, `to` — применяются к обеим сводкам. Счета возвращаются в
своей валюте, сводки переводятся в RUB.

### Валюты (`/api/currency`)
| Метод | Auth | Описание |
|---|---|---|
| GET | — | Список всех валют |
| GET `/rate` | — | Курс для `?from=USD&to=RUB` |

Курсы запрашиваются у шести провайдеров по очереди (ЦБ РФ, Frankfurter,
ExchangeRate.host, CoinGecko, Binance, CDN Fawaz Ahmed) и кешируются в базе,
так что отказ одного провайдера не ломает конвертацию.

## Разработка

Все команды запускаются из корня репозитория через корневой `package.json`.
Один раз выполни `bun run setup`, чтобы поставить зависимости и сгенерировать
контракт Prisma.

### Запуск

```bash
bun run dev:backend    # NestJS API на :3000
bun run dev:frontend   # Next.js на :3000
bun run dev:desktop    # окно Tauri со встроенным фронтендом
```

API и десктопному приложению нужны PostgreSQL и Redis. Либо подними всё
в контейнерах через `bun run docker:up`, либо только сервисы:

```bash
docker compose -f compose.yaml -f deploy/compose.dev.yml up -d db redis
```

### Десктопное приложение

Для сборки нужен Rust toolchain и [зависимости Tauri](https://tauri.app/start/prerequisites/)
под вашу платформу — на Linux это `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`,
`librsvg2-dev` и `libxdo-dev`.

```bash
bun run dev:desktop      # окно Tauri поверх dev-сервера
bun run build:desktop    # Инсталляторы в desktop/src-tauri/target/release/bundle
```

Десктопное приложение хранит всё в локальном файле SQLite и не обращается к
бэкенду. Балансы счетов там поддерживают триггеры SQLite, поэтому падение
посреди записи не разведёт баланс с его транзакциями.

### Проверки

```bash
bun run lint          # backend + frontend
bun run typecheck     # backend + frontend
bun run test          # backend + frontend
bun run build         # backend + frontend + desktop
```

Доступны и варианты для отдельных пакетов: `bun run test:backend`,
`bun run test:cov:backend`, `bun run test:e2e:backend`, `bun run lint:frontend`,
`bun run build:desktop`.

Скрипт, который есть только в одном пакете, запускается напрямую:

```bash
bun run --cwd backend prisma:migrate:dev
bun run --cwd frontend test:watch
```

### Версионирование

Единственный источник версии — `desktop/src-tauri/tauri.conf.json`.

```bash
bun run version              # раскладывает текущую версию по всем манифестам
bun run version:set -- 0.2.0 # задаёт новую версию везде
bun run version:check        # падает, если манифесты разошлись
```

Тег `v<version>` запускает релизный пайплайн. CI отклоняет тег, номер которого
не совпадает с версией приложения.

### Docker

Точка входа — `compose.yaml` в корне репозитория; оверрайды окружений лежат в `deploy/`.

```bash
bun run docker:up     # dev-стек, собранный и запущенный в фоне
bun run docker:logs   # следить за логами
bun run docker:down   # остановить

docker compose -f compose.yaml -f deploy/compose.dev.yml down -v   # Сброс БД
```

Чтобы запустить прод-стек, замените `compose.dev.yml` на `compose.prod.yml`.
`deploy/deploy.sh` (или `deploy\deploy.bat`) делает то же самое интерактивно.

## База данных

| Сущность | Описание |
|---|---|
| **User** | UUID, email, хеш Argon2, время последнего входа |
| **PendingUser** | Неподтверждённая регистрация (удаляется после верификации email) |
| **PasswordResetToken** | 6-значный код с expiry, одноразовый для восстановления пароля |
| **AccountCategory** | Группа сайдбара: основные счета, накопления, инвестиции, кредиты и долги |
| **AccountType** | Наличные, банковский счет, депозит, брокерский, кредитная карта, криптокошелек |
| **Account** | Привязан к пользователю, типу, группе, валюте; баланс + `isDeleted` |
| **Category** | Иерархическая (самоссылающаяся), в рамках пользователя, флаг дохода/расхода, цвет, иконка, `isArchived` |
| **Transaction** | INCOME / EXPENSE / TRANSFER, атомарное обновление баланса |
| **Currency** | 16 валют: 6 фиатных (RUB, USD, EUR, GBP, JPY, CNY) и 10 криптовалют |
| **ExchangeRate** | Кешированный курс по паре, обновляется раз в 3 часа |

Суммы хранятся в колонках с фиксированной точностью, а не во float, и перед
записью округляются; на входе проверяется не более двух знаков после запятой.

## Безопасность

- **Argon2** для хеширования паролей (не bcrypt)
- **JWT** пара: access (15 мин) + refresh (7 дней)
- **Refresh-токен** в httpOnly, SameSite=Lax cookie (защита от XSS)
- **Мягкое удаление** для счетов (`isDeleted`) и категорий (`isArchived`)
- **CORS** ограничен списком origins из конфигурации
- **Ограничение запросов** двойной слой (nginx + NestJS) против brute-force и DDoS
- **Email-верификация** обязательна перед активацией аккаунта
- **60-секундный кулдаун** между повторными отправками кода
- **Одноразовый код сброса**, который тратится в одной транзакции с обновлением пароля
- **Ограниченный CSP** и урезанный набор прав в webview десктопного приложения

## Бэкапы

Образ `db` запускает рядом с PostgreSQL cron и каждую ночь в 03:00 складывает
сжатый `pg_dump` в `./backups`, оставляя `BACKUP_KEEP` последних файлов
(по умолчанию 14) и удаляя остальные.

## Примечания

- Интерфейс на русском языке
- Курсы валют запрашиваются у шести провайдеров с автоматическим переключением при сбое
- Лицензия AGPL-3.0