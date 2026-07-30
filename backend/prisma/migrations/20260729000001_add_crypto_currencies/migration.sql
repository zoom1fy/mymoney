-- Widen currency_code columns to support 4+ char crypto codes (USDT, DOGE, HYPE, etc.)

-- Drop FK constraints referencing currencies.code
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_currency_code_fkey`;
ALTER TABLE `categories` DROP FOREIGN KEY `categories_currency_code_fkey`;
ALTER TABLE `accounts` DROP FOREIGN KEY `accounts_currency_code_fkey`;
ALTER TABLE `currencies` DROP PRIMARY KEY;

-- Widen columns
ALTER TABLE `currencies` MODIFY `code` VARCHAR(10) NOT NULL;
ALTER TABLE `currencies` MODIFY `symbol` VARCHAR(10) NOT NULL;
ALTER TABLE `accounts` MODIFY `currency_code` VARCHAR(10) NOT NULL;
ALTER TABLE `categories` MODIFY `currency_code` VARCHAR(10) NOT NULL;
ALTER TABLE `transactions` MODIFY `currency_code` VARCHAR(10) NOT NULL;

-- Restore PK
ALTER TABLE `currencies` ADD PRIMARY KEY (`code`);

-- Restore FK constraints
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_currency_code_fkey` FOREIGN KEY (`currency_code`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `categories` ADD CONSTRAINT `categories_currency_code_fkey` FOREIGN KEY (`currency_code`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_currency_code_fkey` FOREIGN KEY (`currency_code`) REFERENCES `currencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert new cryptocurrencies
INSERT IGNORE INTO `currencies` (`code`, `name`, `symbol`) VALUES
('ETH', 'Ethereum', 'Ξ'),
('USDT', 'Tether', '₮'),
('USDC', 'USD Coin', 'USDC'),
('BNB', 'BNB', 'BNB'),
('XRP', 'XRP', 'XRP'),
('SOL', 'Solana', 'SOL'),
('TRX', 'TRON', 'TRX'),
('HYPE', 'Hyperliquid', 'HYPE'),
('DOGE', 'Dogecoin', 'Ð');
