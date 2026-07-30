-- Remove HYPE (Hyperliquid) and add GRAM (Gram, formerly Toncoin)

DELETE FROM `currencies` WHERE `code` = 'HYPE';

INSERT IGNORE INTO `currencies` (`code`, `name`, `symbol`) VALUES
('GRAM', 'Gram', 'GRAM');
