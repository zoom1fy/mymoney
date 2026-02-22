@echo off
echo [1/2] Stopping and removing old containers...
docker-compose down -v

echo [2/2] Building and starting containers...
docker-compose up -d --build

echo ========================================
echo          DEPLOYMENT COMPLETED!
echo ========================================
echo.
echo Frontend:   http://localhost:3001
echo Backend:    http://localhost:3000
echo phpMyAdmin: http://localhost:8080
echo.
pause