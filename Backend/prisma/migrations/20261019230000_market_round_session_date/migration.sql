-- Date (IST) the round's market session opened. Overnight markets settle after
-- midnight, so settled_at/settled_on point at the next day.
ALTER TABLE `market_rounds` ADD COLUMN `session_on` DATE NULL;

-- Backfill from the round's first bet (or settled_at when nobody bet).
UPDATE `market_rounds` r
JOIN `markets` m ON m.`id` = r.`market_id`
LEFT JOIN (
    SELECT `market_id`, `round_number`, MIN(`created_at`) AS `first_at`
    FROM `market_entries`
    GROUP BY `market_id`, `round_number`
) e ON e.`market_id` = r.`market_id` AND e.`round_number` = r.`round_number`
SET r.`session_on` = IF(
    m.`close_time` < m.`open_time`
        AND DATE_FORMAT(DATE_ADD(COALESCE(e.`first_at`, r.`settled_at`), INTERVAL 330 MINUTE), '%H:%i') < m.`open_time`,
    DATE_SUB(DATE(DATE_ADD(COALESCE(e.`first_at`, r.`settled_at`), INTERVAL 330 MINUTE)), INTERVAL 1 DAY),
    DATE(DATE_ADD(COALESCE(e.`first_at`, r.`settled_at`), INTERVAL 330 MINUTE))
);

ALTER TABLE `market_rounds` MODIFY `session_on` DATE NOT NULL;

CREATE INDEX `market_rounds_session_on_idx` ON `market_rounds`(`session_on`);
