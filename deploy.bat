@echo off
title Docker Compose Runner

echo ==========================================
echo   Stopping existing containers...
echo ==========================================
docker compose down

echo.
echo ==========================================
echo   Select run mode:
echo ==========================================
echo 1 - Development
echo 2 - Production
echo 3 - Exit
echo.
set /p mode="Enter mode number: "

if "%mode%"=="1" goto dev
if "%mode%"=="2" goto prod
if "%mode%"=="3" goto exit

echo Invalid input. Exiting...
goto exit

:dev
echo.
echo ==========================================
echo   Starting DEV environment
echo ==========================================
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
goto exit

:prod
echo.
echo ==========================================
echo   Starting PROD environment
echo ==========================================
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
goto exit

:exit
echo.
echo Done!
pause