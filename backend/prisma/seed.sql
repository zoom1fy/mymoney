SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM default_categories;
DELETE FROM account_types;
DELETE FROM account_categories;
DELETE FROM currencies;
DELETE FROM categories;
DELETE FROM accounts;
DELETE FROM transactions;

INSERT INTO currencies (code, name, symbol) VALUES
('RUB', 'Российский рубль', '₽'),
('USD', 'Доллар США', '$'),
('EUR', 'Евро', '€'),
('BTC', 'Биткоин', '₿');

INSERT INTO account_categories (id, name) VALUES
(1, 'Счета'),
(2, 'Сбережения');

INSERT INTO account_types (id, name) VALUES
(1, 'Наличные'),
(2, 'Карта'),
(3, 'Криптовалюта'),
(4, 'Накопление'),
(5, 'Вклад');

INSERT INTO default_categories (name, icon, currency_code, is_expense) VALUES
('Продукты', 'cart', 'RUB', TRUE),
('Транспорт', 'bus', 'RUB', TRUE),
('Жилье', 'house', 'RUB', TRUE),
('Здоровье', 'heart-pulse', 'RUB', TRUE),
('Развлечения', 'film', 'RUB', TRUE),
('Одежда', 'shirt', 'RUB', TRUE),
('Связь', 'phone', 'RUB', TRUE),
('Образование', 'book', 'RUB', TRUE),
('Зарплата', 'wallet', 'RUB', FALSE),
('Фриланс', 'laptop', 'RUB', FALSE),
('Инвестиции', 'chart', 'RUB', FALSE),
('Дивиденды', 'coins', 'RUB', FALSE);

INSERT INTO default_categories (name, icon, currency_code, is_expense, parent_id)
SELECT 'Такси', 'taxi', 'RUB', TRUE, id
FROM default_categories WHERE name = 'Транспорт';

INSERT INTO default_categories (name, icon, currency_code, is_expense, parent_id)
SELECT 'Общественный транспорт', 'bus', 'RUB', TRUE, id
FROM default_categories WHERE name = 'Транспорт';

SET FOREIGN_KEY_CHECKS = 1;