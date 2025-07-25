# MyMoney

MyMoney — это приложение для управления финансами, построенное на стеке Next.js (фронтенд), NestJS (бэкенд) и MySQL (база данных). Проект использует Prisma для работы с базой данных и Docker для контейнеризации. Этот документ объясняет, как установить и запустить проект на macOS и Windows.

## Требования
- **Git**: Для клонирования репозитория.
- **Docker**: Установите [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS).
- **Node.js**: Для проверки (опционально, версия 18+).
- Свободные порты: `3306` (MySQL), `8080` (phpMyAdmin), `3000` (NestJS), `3001` (Next.js).

## Установка и запуск
1. **Клонируйте репозиторий**:
   ```bash
   git clone <URL_репозитория>
   cd mymoney
   ```

2. **Настройте файл окружения**:
   Скопируйте `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```
   Откройте `.env` и убедитесь, что он содержит:
   ```env
   MYSQL_ROOT_PASSWORD=$YOUR_PASS
   MYSQL_USER=$YOUR_USER
   MYSQL_PASSWORD=$YOUR_PASS
   MYSQL_DATABASE=mymoneydb
   DATABASE_URL=mysql://$YOUR_USER:$YOUR_PASS@db:3306/$mymoneydb
   NESTJS_PORT=3000
   NEXTJS_PORT=3001
   ```

   Скопируйте в `backend/.env`:
   Создайте `.env` и убедитесь, что он содержит:
   ```env
    DATABASE_URL=mysql://$YOUR_USER:$YOUR_PASS@db:3306/mymoneydb
    JWT_SECRET="ТВОЙ_СЕКРЕТНЫЙ_КЛЮЧ"

    # Таймауты токенов
    JWT_ACCESS_EXPIRES_IN=15m
    JWT_REFRESH_EXPIRES_IN=7d
   
    # Имя куки для refresh-токена
    REFRESH_TOKEN_COOKIE_NAME=refresh_token
   
    # Среда (development|production)
    NODE_ENV=development
   ```

3. **Запустите проект**:
   - **На macOS**:
     ```bash
     chmod +x deploy.sh
     ./deploy.sh
     ```
   - **На Windows**:
     ```bash
     deploy.bat
     ```

   Скрипт выполнит:
   - Остановку и удаление старых контейнеров.
   - Сборку и запуск контейнеров (`db`, `backend`, `frontend`, `phpmyadmin`).
   - Настройку прав MySQL для пользователя `$YOUR_USER`.
   - Применение миграций Prisma.
   - Загрузку начальных данных (`seed.sql`) с поддержкой UTF-8.
   - Перезапуск бэкенда с правильным `DATABASE_URL`.

4. **Проверьте запуск**:
   - Фронтенд: `http://localhost:3001`
   - API: `http://localhost:3000`
   - phpMyAdmin: `http://localhost:8080` (логин: `$YOUR_USER`/`$YOUR_PASS` или `root`/`$YOUR_PASS`)

5. **Проверка данных**:
   ```bash
   docker exec -it mymoney-db-1 mysql -u root -p$YOUR_PASS -e "USE mymoneydb; SELECT * FROM currencies;"
   ```
   Ожидаемый вывод:
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

## Устранение неполадок
- **Кодировка в phpMyAdmin**: Если русские символы отображаются как `Ð Ð¾ÑÑÐ¸Ð¹ÑÐºÐ¸Ð¹`, проверьте:
  - В `docker-compose.yml` должен быть `PMA_CONFIG` с `$cfg['DefaultCharset'] = 'utf8mb4'`.
  - Выполните в phpMyAdmin:
    ```sql
    SET NAMES utf8mb4;
    SELECT * FROM currencies;
    ```
- **Контейнер `mymoney-db-1` не запускается**:
  - Проверьте логи: `docker-compose logs db`.
  - Убедитесь, что порт `3306` свободен:
    ```bash
    netstat -aon | findstr :3306  # Windows
    lsof -i :3306  # macOS
    ```
  - Увеличьте время ожидания в `deploy.sh`/`deploy.bat` (`sleep 30` или `timeout /t 30`).
- **Переменные окружения не загружаются**:
  - Убедитесь, что `.env` в корне проекта и в кодировке UTF-8 без BOM.
  - Проверьте `env_file: - .env` в `docker-compose.yml`.

## Примечания
- Проект настроен для поддержки русских символов (кодировка `utf8mb4_unicode_ci`).
- Для остановки проекта:
  ```bash
  docker-compose down -v
  ```
