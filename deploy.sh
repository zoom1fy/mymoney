#!/bin/bash

echo "Остановка и удаление существующих контейнеров и томов..."
docker-compose down -v

echo "Запуск контейнеров..."
docker-compose up -d --build

echo "Ожидание готовности базы данных..."
sleep 15

echo "Настройка прав MySQL для admin..."
docker exec -it mymoney-db-1 mysql -u root -p2006 -e "GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"

echo "Применение Prisma миграций..."
docker exec -it mymoney-backend-1 bash -c "cd /app && DATABASE_URL=mysql://root:2006@db:3306/mymoneydb npx prisma migrate dev --name init"

echo "Копирование и применение seed.sql..."
docker cp backend/prisma/seed.sql mymoney-db-1:/seed.sql
docker exec -it mymoney-db-1 mysql -u root -p2006 mymoneydb -e "SOURCE /seed.sql;"

echo "Восстановление DATABASE_URL для admin..."
docker exec -it mymoney-backend-1 bash -c "echo 'DATABASE_URL=mysql://admin:2006@db:3306/mymoneydb' > /app/.env"
docker-compose restart backend

echo "Развёртывание завершено!"
