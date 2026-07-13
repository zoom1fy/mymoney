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
    INSERT INTO currencies (code, name, symbol) VALUES
    ('RUB', 'Российский рубль', '₽'),
    ('USD', 'Доллар США', '$'),
    ('EUR', 'Евро', '€');
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
