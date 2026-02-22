import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Проверяем, пуста ли БД (например, по currencies)
  const currencyCount = await prisma.currency.count();
  if (currencyCount > 0) {
    console.log('✅ База данных уже заполнена — пропускаем seed.');
    return; // ← Выходим, не чистим и не добавляем
  }

  // Очищаем таблицы в правильном порядке (учитывая внешние ключи)
  console.log('Очистка таблиц...');

  // Сначала удаляем зависимости
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;

  await prisma.$executeRaw`DELETE FROM default_categories;`;
  await prisma.$executeRaw`DELETE FROM account_types;`;
  await prisma.$executeRaw`DELETE FROM account_categories;`;
  await prisma.$executeRaw`DELETE FROM currencies;`;
  await prisma.$executeRaw`DELETE FROM categories;`;
  await prisma.$executeRaw`DELETE FROM accounts;`;
  await prisma.$executeRaw`DELETE FROM transactions;`;

  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;

  // Добавляем валюты
  console.log('Добавление валют...');
  await prisma.$executeRaw`
    INSERT INTO currencies (code, name, symbol) VALUES
    ('RUB', 'Российский рубль', '₽'),
    ('USD', 'Доллар США', '$'),
    ('EUR', 'Евро', '€'),
    ('BTC', 'Биткоин', '₿');
  `;

  // Добавляем категории счетов
  console.log('Добавление категорий счетов...');
  await prisma.$executeRaw`
    INSERT INTO account_categories (id, name) VALUES
    (1, 'Счета'),
    (2, 'Сбережения');
  `;

  // Добавляем типы счетов
  console.log('Добавление типов счетов...');
  await prisma.$executeRaw`
    INSERT INTO account_types (id, name) VALUES
    (1, 'Наличные'),
    (2, 'Карта'),
    (3, 'Криптовалюта'),
    (4, 'Накопление'),
    (5, 'Вклад');
  `;

  // Добавляем категории по умолчанию
  console.log('Добавление категорий...');

  // Сначала основные категории
  await prisma.$executeRaw`
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
  `;

  // Добавляем подкатегории для Транспорта
  console.log('Добавление подкатегорий...');

  // Получаем id транспорта
  const transport = await prisma.$queryRaw<
    [{ id: number }]
  >`SELECT id FROM default_categories WHERE name = 'Транспорт' LIMIT 1;`;
  const transportId = transport[0].id;

  await prisma.$executeRaw`
    INSERT INTO default_categories (name, icon, currency_code, is_expense, parent_id) VALUES
    ('Такси', 'taxi', 'RUB', TRUE, ${transportId}),
    ('Общественный транспорт', 'bus', 'RUB', TRUE, ${transportId});
  `;

  console.log('✅ База данных успешно заполнена!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
