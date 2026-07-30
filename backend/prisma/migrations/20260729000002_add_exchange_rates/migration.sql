-- CreateTable
CREATE TABLE `exchange_rates` (
    `from` VARCHAR(10) NOT NULL,
    `to` VARCHAR(10) NOT NULL,
    `rate` DECIMAL(20, 10) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`from`, `to`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
