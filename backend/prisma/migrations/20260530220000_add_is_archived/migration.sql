-- AlterTable: add missing columns to categories
ALTER TABLE `categories` DROP FOREIGN KEY `categories_default_category_id_fkey`;
ALTER TABLE `categories` DROP COLUMN `default_category_id`;
ALTER TABLE `categories` ADD COLUMN `color` VARCHAR(7) NULL DEFAULT '';
ALTER TABLE `categories` ADD COLUMN `is_archived` TINYINT(1) NOT NULL DEFAULT 0;

-- CreateTable: chat_messages
CREATE TABLE `chat_messages` (
    `id` VARCHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `role` ENUM('USER', 'ASSISTANT') NOT NULL DEFAULT 'USER',
    `content` MEDIUMTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `chat_messages_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
