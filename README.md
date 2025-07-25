# MyMoney

- [Русский](README.ru.md)
- [English](README.md)

MyMoney is a financial management application built with Next.js (frontend), NestJS (backend), and MySQL (database). The project uses Prisma for database operations and Docker for containerization. This document explains how to install and run the project on macOS and Windows.

## Requirements
- **Git**: For cloning the repository.
- **Docker**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS).
- **Node.js**: Optional for verification (version 18+).
- Free ports: `3306` (MySQL), `8080` (phpMyAdmin), `3000` (NestJS), `3001` (Next.js).

## Installation and Setup
1. **Clone the repository**:
   ```bash
   git clone <repository_URL>
   cd mymoney
   ```

2. **Set up the environment file**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and ensure it contains:
   ```env
   MYSQL_ROOT_PASSWORD=$YOUR_PASS
   MYSQL_USER=$YOUR_USER
   MYSQL_PASSWORD=$YOUR_PASS
   MYSQL_DATABASE=$YOUR_DB_NAME
   DATABASE_URL=mysql://$YOUR_USER:$YOUR_PASS@db:3306/$YOUR_DB_NAME
   NESTJS_PORT=3000
   NEXTJS_PORT=3001
   ```

   Copy to `backend/.env`:
   Create `.env` and make sure, it include:
   ```env
    DATABASE_URL=mysql://$YOUR_USER:$YOUR_PASS@db:3306/mymoneydb
    JWT_SECRET="${YOUR_SECRET_KEY}"
   ```

3. **Run the project**:
   - **On macOS**:
     ```bash
     chmod +x deploy.sh
     ./deploy.sh
     ```
   - **On Windows**:
     ```bash
     deploy.bat
     ```

   The script will:
   - Stop and remove old containers.
   - Build and start containers (`db`, `backend`, `frontend`, `phpmyadmin`).
   - Set up MySQL permissions for the `$YOUR_USER` user.
   - Apply Prisma migrations.
   - Load initial data (`seed.sql`) with UTF-8 support.
   - Restart the backend with the correct `DATABASE_URL`.

4. **Verify the setup**:
   - Frontend: `http://localhost:3001`
   - API: `http://localhost:3000`
   - phpMyAdmin: `http://localhost:8080` (login: `$YOUR_USER`/`$YOUR_PASS` or `root`/`$YOUR_PASS`)

5. **Check the data**:
   ```bash
   docker exec -it mymoney-db-1 mysql -u root -p$YOUR_PASS -e "USE mymoneydb; SELECT * FROM currencies;"
   ```
   Expected output:
   ```
   +-----+--------------------+--------+
   | code | name               | symbol |
   +-----+--------------------+--------+
   | RUB | Российский рубль   | ₽      |
   | USD | Доллар США         | $      |
   | EUR | Евро               | €      |
   | BTC | Биткоин            | ₿      |
   +-----+--------------------+--------+
   ```

## Troubleshooting
- **Encoding issues in phpMyAdmin**: If Russian characters appear as `Ð Ð¾ÑÑÐ¸Ð¹ÑÐºÐ¸Ð¹`, check:
  - `docker-compose.yml` should have `PMA_CONFIG` with `$cfg['DefaultCharset'] = 'utf8mb4'`.
  - Run in phpMyAdmin:
    ```sql
    SET NAMES utf8mb4;
    SELECT * FROM currencies;
    ```
- **Container `mymoney-db-1` fails to start**:
  - Check logs: `docker-compose logs db`.
  - Ensure port `3306` is free:
    ```bash
    netstat -aon | findstr :3306  # Windows
    lsof -i :3306  # macOS
    ```
  - Increase wait time in `deploy.sh`/`deploy.bat` (`sleep 30` or `timeout /t 30`).
- **Environment variables not loaded**:
  - Ensure `.env` is in the project root and in UTF-8 encoding without BOM.
  - Verify `env_file: - .env` in `docker-compose.yml`.

## Notes
- The project supports Russian characters (encoding `utf8mb4_unicode_ci`).
- To stop the project:
  ```bash
  docker-compose down -v
  ```
