ALTER TABLE `market_rounds`
  ADD COLUMN `settled_on` DATE NULL;

UPDATE `market_rounds`
SET `settled_on` = DATE(CONVERT_TZ(`settled_at`, '+00:00', '+05:30'));

DELETE `older`
FROM `market_rounds` AS `older`
INNER JOIN `market_rounds` AS `newer`
  ON `older`.`market_id` = `newer`.`market_id`
  AND `older`.`settled_on` = `newer`.`settled_on`
  AND (
    `older`.`settled_at` < `newer`.`settled_at`
    OR (`older`.`settled_at` = `newer`.`settled_at` AND `older`.`id` < `newer`.`id`)
  );

ALTER TABLE `market_rounds`
  MODIFY `settled_on` DATE NOT NULL,
  ADD UNIQUE INDEX `market_rounds_market_id_settled_on_key` (`market_id`, `settled_on`);
