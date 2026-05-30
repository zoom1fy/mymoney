-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` CHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currencies` (
    `code` CHAR(3) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `symbol` VARCHAR(5) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_categories` (
    `id` TINYINT UNSIGNED NOT NULL,
    `name` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `account_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_types` (
    `id` TINYINT UNSIGNED NOT NULL,
    `name` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `account_types_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(36) NOT NULL,
    `category_id` TINYINT UNSIGNED NOT NULL,
    `type_id` TINYINT UNSIGNED NOT NULL,
    `currency_code` CHAR(3) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) NOT NULL DEFAULT 'default',
    `currentBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `accounts_user_id_category_id_idx`(`user_id`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `default_categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) NOT NULL DEFAULT 'default',
    `currency_code` CHAR(3) NOT NULL,
    `is_expense` BOOLEAN NOT NULL,
    `parent_id` INTEGER UNSIGNED NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) NOT NULL DEFAULT 'default',
    `currency_code` CHAR(3) NOT NULL,
    `is_expense` BOOLEAN NOT NULL,
    `parent_id` INTEGER UNSIGNED NULL,
    `default_category_id` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `categories_user_id_is_expense_idx`(`user_id`, `is_expense`),
    UNIQUE INDEX `categories_user_id_name_key`(`user_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(36) NOT NULL,
    `account_id` INTEGER UNSIGNED NOT NULL,
    `target_account_id` INTEGER UNSIGNED NULL,
    `category_id` INTEGER UNSIGNED NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `currency_code` CHAR(3) NOT NULL,
    `transaction_date` DATETIME NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('INCOME', 'EXPENSE', 'TRANSFER') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transactions_user_id_transaction_date_idx`(`user_id`, `transaction_date`),
    INDEX `transactions_account_id_transaction_date_idx`(`account_id`, `transaction_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `account_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `account_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_currency_code_fkey` FOREIGN KEY (`currency_code`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `default_categories` ADD CONSTRAINT `default_categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `default_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `default_categories` ADD CONSTRAINT `default_categories_currency_code_fkey` FOREIGN KEY (`currency_code`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_currency_code_fkey` FOREIGN KEY (`currency_code`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_default_category_id_fkey` FOREIGN KEY (`default_category_id`) REFERENCES `default_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_currency_code_fkey` FOREIGN KEY (`currency_code`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;
