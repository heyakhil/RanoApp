ALTER TABLE `market_rounds`
    MODIFY `result` VARCHAR(120) NULL,
    ADD COLUMN `status` ENUM('settled', 'canceled') NOT NULL DEFAULT 'settled';
