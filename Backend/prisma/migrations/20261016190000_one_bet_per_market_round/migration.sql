CREATE TABLE `market_participations` (
    `id` VARCHAR(191) NOT NULL,
    `market_id` VARCHAR(191) NOT NULL,
    `round_number` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `market_participations_market_id_round_number_user_id_key`(`market_id`, `round_number`, `user_id`),
    INDEX `market_participations_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `market_participations` (`id`, `market_id`, `round_number`, `user_id`, `created_at`)
SELECT
    CONCAT('legacy-', SHA2(CONCAT_WS(':', `market_id`, `round_number`, `user_id`), 256)),
    `market_id`,
    `round_number`,
    `user_id`,
    MIN(`created_at`)
FROM `market_entries`
GROUP BY `market_id`, `round_number`, `user_id`;

ALTER TABLE `market_participations`
    ADD CONSTRAINT `market_participations_market_id_fkey`
        FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `market_participations_user_id_fkey`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
