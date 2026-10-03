@echo off
title Docker Compose Runner

rem The Compose files are addressed relative to the repository root, so the
rem script has to run from there regardless of the current directory.
pushd "%~dp0.."

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
docker compose -f compose.yaml -f deploy/compose.dev.yml up --build -d
goto exit

:prod
echo.
echo ==========================================
echo   Starting PROD environment
echo ==========================================
docker compose -f compose.yaml -f deploy/compose.prod.yml up --build -d
goto exit

:exit
echo.
echo Done!
popd
pause