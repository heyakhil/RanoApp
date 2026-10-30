ALTER TABLE `markets`
  MODIFY `close_time` VARCHAR(5) NULL,
  ADD COLUMN `country_code` VARCHAR(2) NOT NULL DEFAULT 'IN',
  ADD COLUMN `session_open_at` DATETIME(3) NULL,
  ADD COLUMN `session_close_at` DATETIME(3) NULL,
  ADD COLUMN `last_close_fetch_at` DATETIME(3) NULL;

ALTER TABLE `market_rounds`
  ADD COLUMN `session_close_at` DATETIME(3) NULL;

-- Carry active bets onto a persisted session before retiring manually set close times.
UPDATE `markets` m
JOIN (
  SELECT e.`market_id`, e.`round_number`, MIN(e.`created_at`) AS first_at
  FROM `market_entries` e
  GROUP BY e.`market_id`, e.`round_number`
) active ON active.`market_id` = m.`id` AND active.`round_number` = m.`current_round`
SET m.`session_open_at` = DATE_SUB(
      TIMESTAMP(
        IF(DATE_FORMAT(DATE_ADD(active.first_at, INTERVAL 330 MINUTE), '%H:%i') < m.`open_time`,
          DATE_SUB(DATE(DATE_ADD(active.first_at, INTERVAL 330 MINUTE)), INTERVAL 1 DAY),
          DATE(DATE_ADD(active.first_at, INTERVAL 330 MINUTE))),
        m.`open_time`), INTERVAL 330 MINUTE),
    m.`session_close_at` = DATE_ADD(DATE_SUB(
      TIMESTAMP(
        IF(DATE_FORMAT(DATE_ADD(active.first_at, INTERVAL 330 MINUTE), '%H:%i') < m.`open_time`,
          DATE_SUB(DATE(DATE_ADD(active.first_at, INTERVAL 330 MINUTE)), INTERVAL 1 DAY),
          DATE(DATE_ADD(active.first_at, INTERVAL 330 MINUTE))),
        m.`close_time`), INTERVAL 330 MINUTE),
      INTERVAL IF(m.`close_time` < m.`open_time`, 1, 0) DAY);

UPDATE `markets` SET `close_time` = NULL WHERE `session_close_at` IS NULL;
