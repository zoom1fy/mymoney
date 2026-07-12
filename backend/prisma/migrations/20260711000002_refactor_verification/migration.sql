-- Drop verification columns from users (moved to pending_users)
ALTER TABLE `users`
  DROP COLUMN `is_verified`,
  DROP COLUMN `verification_code`,
  DROP COLUMN `verification_sent_at`;

-- CreateTable
CREATE TABLE `pending_users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` CHAR(255) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `sent_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pending_users_email_key`(`email`),
    INDEX `pending_users_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
