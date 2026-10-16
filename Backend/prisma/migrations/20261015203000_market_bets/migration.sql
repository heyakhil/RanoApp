ALTER TABLE `markets`
    ADD COLUMN `current_round` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `last_result` VARCHAR(120) NULL;

CREATE TABLE `market_entries` (
    `id` VARCHAR(191) NOT NULL,
    `market_id` VARCHAR(191) NOT NULL,
    `round_number` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `market_entries_user_id_idx`(`user_id`),
    UNIQUE INDEX `market_entries_market_id_round_number_user_id_key`(`market_id`, `round_number`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `market_rounds` (
    `id` VARCHAR(191) NOT NULL,
    `market_id` VARCHAR(191) NOT NULL,
    `round_number` INTEGER NOT NULL,
    `result` VARCHAR(120) NOT NULL,
    `participant_count` INTEGER NOT NULL,
    `total_bet_amount` DECIMAL(12, 2) NOT NULL,
    `commission_amount` DECIMAL(12, 2) NOT NULL,
    `admin_share` DECIMAL(12, 2) NOT NULL,
    `subadmin_share` DECIMAL(12, 2) NOT NULL,
    `settled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `market_rounds_settled_at_idx`(`settled_at`),
    UNIQUE INDEX `market_rounds_market_id_round_number_key`(`market_id`, `round_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `commission_entries` (
    `id` VARCHAR(191) NOT NULL,
    `market_id` VARCHAR(191) NOT NULL,
    `round_number` INTEGER NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `commission_entries_role_idx`(`role`),
    INDEX `commission_entries_market_id_round_number_idx`(`market_id`, `round_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `market_entries`
    ADD CONSTRAINT `market_entries_market_id_fkey`
    FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `market_entries`
    ADD CONSTRAINT `market_entries_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `market_rounds`
    ADD CONSTRAINT `market_rounds_market_id_fkey`
    FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `commission_entries`
    ADD CONSTRAINT `commission_entries_market_id_fkey`
    FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
