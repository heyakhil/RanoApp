ALTER TABLE `markets`
    ADD COLUMN `last_settled_close` DATETIME(3) NULL;

ALTER TABLE `market_entries`
    ADD COLUMN `payout_amount` DECIMAL(12, 2) NULL;
