@echo off
echo Stopping and deleting existing containers and volumes...
docker-compose down -v

echo Launching containers...
docker-compose up -d --build

echo Waiting for database to be ready...
timeout /t 15

echo Setting up MySQL rights for admin...
docker exec -it mymoney-db-1 mysql -u root -p2006 -e "GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"

echo Using Prisma migrations...
docker exec -it mymoney-backend-1 bash -c "cd /app && DATABASE_URL=mysql://root:2006@db:3306/mymoneydb npx prisma migrate dev --name init"

echo Copying and applying seed.sql...
docker cp backend\prisma\seed.sql mymoney-db-1:/seed.sql
docker exec -it mymoney-db-1 mysql -u root -p2006 mymoneydb -e "SET NAMES utf8mb4; SET FOREIGN_KEY_CHECKS = 0; SOURCE /seed.sql; SET FOREIGN_KEY_CHECKS = 1;"

echo Restarting backend...
docker-compose restart backend

echo Checking data in currencies table...
docker exec -it mymoney-db-1 mysql -u root -p2006 -e "USE mymoneydb; SELECT * FROM currencies;"

echo Развёртывание завершено!
pause