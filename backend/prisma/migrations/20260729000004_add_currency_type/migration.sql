-- Add CurrencyType enum and `type` column to currencies

ALTER TABLE `currencies` ADD COLUMN `type` ENUM('FIAT', 'CRYPTO') NOT NULL DEFAULT 'FIAT';

UPDATE `currencies` SET `type` = 'FIAT' WHERE `code` IN ('RUB', 'USD', 'EUR');
UPDATE `currencies` SET `type` = 'CRYPTO' WHERE `code` NOT IN ('RUB', 'USD', 'EUR');
