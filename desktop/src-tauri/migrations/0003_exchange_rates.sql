-- Static starter exchange rates to RUB. The desktop build has no live rate
-- API (the web backend pulls exchangerate hosts at bootstrap), so these are
-- frozen approximate demo values; RUB itself is the base = 1.
INSERT INTO "ExchangeRate" ("from", "to", rate, updatedAt) VALUES
    ('RUB',  'RUB', '1',        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('USD',  'RUB', '80',       strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('EUR',  'RUB', '95',       strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('GBP',  'RUB', '110',      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('JPY',  'RUB', '0.55',     strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('CNY',  'RUB', '11.2',     strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('BTC',  'RUB', '8200000',  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('ETH',  'RUB', '320000',   strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('USDT', 'RUB', '80',       strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('USDC', 'RUB', '80',       strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('BNB',  'RUB', '55000',    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('XRP',  'RUB', '120',      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('SOL',  'RUB', '14000',    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('TRX',  'RUB', '22',       strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('DOGE', 'RUB', '12',       strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    ('GRAM', 'RUB', '5',        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT DO NOTHING;
