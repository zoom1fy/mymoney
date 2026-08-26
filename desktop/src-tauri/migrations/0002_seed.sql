-- Reference data shared across users + demo data for the local single user.
-- Mirrors backend/src/seed/seed.service.ts.

INSERT INTO "User" (id, email, passwordHash)
VALUES ('00000000-0000-0000-0000-000000000001', 'local@mymoney.app', 'local');

INSERT INTO "Currency" (code, name, symbol, type) VALUES
    ('RUB',  'Российский рубль', '₽',    'FIAT'),
    ('USD',  'Доллар США',       '$',    'FIAT'),
    ('EUR',  'Евро',             '€',    'FIAT'),
    ('GBP',  'Фунт стерлингов',  '£',    'FIAT'),
    ('JPY',  'Японская иена',    '¥',    'FIAT'),
    ('CNY',  'Китайский юань',   '¥',    'FIAT'),
    ('BTC',  'Bitcoin',          '₿',    'CRYPTO'),
    ('ETH',  'Ethereum',         'Ξ',    'CRYPTO'),
    ('USDT', 'Tether',           '₮',    'CRYPTO'),
    ('USDC', 'USD Coin',         'USDC', 'CRYPTO'),
    ('BNB',  'BNB',              'BNB',  'CRYPTO'),
    ('XRP',  'XRP',              'XRP',  'CRYPTO'),
    ('SOL',  'Solana',           'SOL',  'CRYPTO'),
    ('TRX',  'TRON',             'TRX',  'CRYPTO'),
    ('DOGE', 'Dogecoin',         'Ð',    'CRYPTO'),
    ('GRAM', 'Gram',             'GRAM', 'CRYPTO');

INSERT INTO "AccountCategory" (id, name) VALUES
    (1, 'Основные счета'),
    (2, 'Накопления'),
    (3, 'Инвестиции'),
    (4, 'Кредиты и долги');

INSERT INTO "AccountType" (id, name) VALUES
    (1, 'Наличные'),
    (2, 'Банковский счет'),
    (3, 'Депозит/Вклад'),
    (4, 'Брокерский счет'),
    (5, 'Кредитная карта'),
    (6, 'Криптокошелек');

-- Demo data for the local user (mirrors SeedService.seedNewUser)
INSERT INTO "Category" (userId, name, icon, currencyCode, color, isExpense) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Зарплата',  'Briefcase',    'RUB', '#22c55e', 0),
    ('00000000-0000-0000-0000-000000000001', 'Фриланс',   'Laptop',       'RUB', '#3b82f6', 0),
    ('00000000-0000-0000-0000-000000000001', 'Продукты',  'ShoppingCart', 'RUB', '#ef4444', 1),
    ('00000000-0000-0000-0000-000000000001', 'Транспорт', 'Car',          'RUB', '#f59e0b', 1);

INSERT INTO "Account" (userId, categoryId, typeId, currencyCode, name, icon, currentBalance) VALUES
    ('00000000-0000-0000-0000-000000000001', 1, 1, 'RUB', 'Наличные', 'Wallet',    '50000'),
    ('00000000-0000-0000-0000-000000000001', 2, 3, 'RUB', 'Копилка',  'PiggyBank', '20000');

INSERT INTO "Transaction" (userId, accountId, categoryId, amount, currencyCode, transactionDate, description, type) VALUES
    ('00000000-0000-0000-0000-000000000001', 1, 1, '100000', 'RUB',
        strftime('%Y-%m-%dT00:00:00.000Z', date('now', 'start of month', '+4 day')), 'Зарплата за месяц', 'INCOME'),
    ('00000000-0000-0000-0000-000000000001', 1, 3, '15000', 'RUB',
        strftime('%Y-%m-%dT00:00:00.000Z', date('now', 'start of month', '+9 day')), 'Продукты на неделю', 'EXPENSE'),
    ('00000000-0000-0000-0000-000000000001', 1, 4, '5000', 'RUB',
        strftime('%Y-%m-%dT00:00:00.000Z', date('now', 'start of month', '+14 day')), 'Проезд и топливо', 'EXPENSE');
