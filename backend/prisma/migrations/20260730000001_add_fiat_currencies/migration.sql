-- Add fiat currencies GBP, JPY, CNY

INSERT IGNORE INTO `currencies` (`code`, `name`, `symbol`, `type`) VALUES
('GBP', 'Фунт стерлингов', '£', 'FIAT'),
('JPY', 'Японская иена', '¥', 'FIAT'),
('CNY', 'Китайский юань', '¥', 'FIAT');
