CREATE TABLE `markets` (
    `id` VARCHAR(191) NOT NULL,
    `slot` TINYINT UNSIGNED NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `symbol` VARCHAR(20) NOT NULL,
    `open_time` VARCHAR(5) NOT NULL,
    `close_time` VARCHAR(5) NOT NULL,
    `max_participants` INTEGER NOT NULL,
    `participants` INTEGER NOT NULL DEFAULT 0,
    `entry_amount` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `markets_symbol_key`(`symbol`),
    UNIQUE INDEX `markets_slot_key`(`slot`),
    INDEX `markets_open_time_idx`(`open_time`),
    PRIMARY KEY (`id`),
    CONSTRAINT `markets_slot_range_check` CHECK (`slot` BETWEEN 1 AND 5)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
