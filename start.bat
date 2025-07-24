@echo off
echo Запуск Docker-контейнеров...
docker-compose up -d

echo Проверка состояния контейнеров...
docker-compose ps

pause