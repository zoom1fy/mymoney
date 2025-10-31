# #!/bin/bash

# echo "Остановка и удаление существующих контейнеров и томов..."
# docker-compose down -v

# echo "Запуск контейнеров..."
# docker-compose up -d --build

# echo "Ожидание готовности базы данных..."
# sleep 15

# echo "Настройка прав MySQL для admin..."
# docker exec -it mymoney-db-1 mysql -u root -p2006 -e "GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"

# echo "Применение Prisma миграций..."
# docker exec -it mymoney-backend-1 bash -c "cd /app && DATABASE_URL=mysql://root:2006@db:3306/mymoneydb npx prisma migrate dev --name init"

# echo "Копирование и применение seed.sql..."
# docker cp backend/prisma/seed.sql mymoney-db-1:/seed.sql
# docker exec -it mymoney-db-1 mysql -u root -p2006 mymoneydb -e "SOURCE /seed.sql;"

# echo "Восстановление DATABASE_URL для admin..."
# docker-compose restart backend

# echo "Развёртывание завершено!"


#!/bin/bash
set -euo pipefail

# Загружаем .env
if [ -f .env ]; then
  echo "Загружаем .env..."
  export $(grep -v '^#' .env | xargs)
else
  echo "ОШИБКА: .env не найден!"
  exit 1
fi

: "${MYSQL_ROOT_PASSWORD:?MISSING MYSQL_ROOT_PASSWORD}"
: "${MYSQL_DATABASE:?MISSING MYSQL_DATABASE}"
: "${DATABASE_URL_PRISMA:?MISSING DATABASE_URL_PRISMA}"

echo "Остановка всего..."
docker-compose down -v

echo "Запуск БД..."
docker-compose up -d db

echo "Ожидание MySQL..."
until docker exec mymoney-db-1 mysql -u root --password="$MYSQL_ROOT_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; do
  echo "   ждём MySQL..."
  sleep 2
done
echo "MySQL готов."

echo "Запуск backend..."
docker-compose up -d backend

echo "Ожидание backend..."
until [ "$(docker inspect -f '{{.State.Running}}' mymoney-backend-1)" == "true" ]; do
  sleep 2
done

echo "Миграции..."
docker exec mymoney-backend-1 sh -c "cd /app && npx prisma migrate deploy"
docker exec mymoney-backend-1 sh -c "cd /app && npx prisma generate"

echo "Seed..."
docker cp backend/prisma/seed.sql mymoney-db-1:/seed.sql
docker exec mymoney-db-1 mysql -u root --password="$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" -e "SOURCE /seed.sql;"

echo "Frontend..."
docker-compose up -d frontend

echo "ГОТОВО!"
echo "   Frontend: http://localhost:3001"
echo "   Backend:  http://localhost:3000"
echo "   phpMyAdmin: http://localhost:8080"