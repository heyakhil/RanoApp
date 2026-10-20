-- Replace the fixed entry amount with a min/max range; users choose their own bet amount.
ALTER TABLE `markets`
    ADD COLUMN `min_bet_amount` DECIMAL(10, 2) NULL,
    ADD COLUMN `max_bet_amount` DECIMAL(10, 2) NULL;

-- Existing markets keep their old entry amount as both bounds until an admin widens the range.
UPDATE `markets` SET `min_bet_amount` = `entry_amount`, `max_bet_amount` = `entry_amount`;

ALTER TABLE `markets`
    MODIFY `min_bet_amount` DECIMAL(10, 2) NOT NULL,
    MODIFY `max_bet_amount` DECIMAL(10, 2) NOT NULL,
    DROP COLUMN `entry_amount`;
