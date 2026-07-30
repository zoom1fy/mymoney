import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Skip if already seeded — makes the script idempotent for dev restarts
  const currencyCount = await prisma.currency.count();
  if (currencyCount > 0) {
    console.log('✅ Database already seeded — skipping.');
    return;
  }

  // Disable FK checks so tables can be cleared in any order without constraint violations
  console.log('Clearing tables...');
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;

  await prisma.$executeRaw`DELETE FROM account_types;`;
  await prisma.$executeRaw`DELETE FROM account_categories;`;
  await prisma.$executeRaw`DELETE FROM currencies;`;
  await prisma.$executeRaw`DELETE FROM categories;`;
  await prisma.$executeRaw`DELETE FROM accounts;`;
  await prisma.$executeRaw`DELETE FROM transactions;`;

  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;

  console.log('Inserting currencies...');
  await prisma.$executeRaw`
    INSERT INTO currencies (code, name, symbol, type) VALUES
    ('RUB', 'Российский рубль', '₽', 'FIAT'),
    ('USD', 'Доллар США', '$', 'FIAT'),
    ('EUR', 'Евро', '€', 'FIAT'),
    ('GBP', 'Фунт стерлингов', '£', 'FIAT'),
    ('JPY', 'Японская иена', '¥', 'FIAT'),
    ('CNY', 'Китайский юань', '¥', 'FIAT'),
    ('BTC', 'Bitcoin', '₿', 'CRYPTO'),
    ('ETH', 'Ethereum', 'Ξ', 'CRYPTO'),
    ('USDT', 'Tether', '₮', 'CRYPTO'),
    ('USDC', 'USD Coin', 'USDC', 'CRYPTO'),
    ('BNB', 'BNB', 'BNB', 'CRYPTO'),
    ('XRP', 'XRP', 'XRP', 'CRYPTO'),
    ('SOL', 'Solana', 'SOL', 'CRYPTO'),
    ('TRX', 'TRON', 'TRX', 'CRYPTO'),
    ('DOGE', 'Dogecoin', 'Ð', 'CRYPTO'),
    ('GRAM', 'Gram', 'GRAM', 'CRYPTO');
  `;

  console.log('Inserting account categories...');
  await prisma.$executeRaw`
    INSERT INTO account_categories (id, name) VALUES
    (1, 'Счета'),
    (2, 'Накопительные');
  `;

  console.log('Inserting account types...');
  await prisma.$executeRaw`
    INSERT INTO account_types (id, name) VALUES
    (1, 'Наличные'),
    (2, 'Карта'),
    (3, 'Депозит'),
    (4, 'Инвестиционный счет');
  `;

  console.log('✅ Database seeded successfully!');
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
