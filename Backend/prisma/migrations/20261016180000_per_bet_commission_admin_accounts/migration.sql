CREATE TABLE `admin_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(120) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'subadmin') NOT NULL,
    `commission_balance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_accounts_username_key`(`username`),
    UNIQUE INDEX `admin_accounts_role_key`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `market_rounds`
    DROP COLUMN `commission_amount`,
    DROP COLUMN `admin_share`,
    DROP COLUMN `subadmin_share`;

ALTER TABLE `market_entries`
    DROP INDEX `market_entries_market_id_round_number_user_id_key`,
    ADD INDEX `market_entries_market_id_round_number_user_id_idx`(`market_id`, `round_number`, `user_id`);

ALTER TABLE `commission_entries`
    MODIFY `role` ENUM('admin', 'subadmin') NOT NULL,
    ADD COLUMN `account_id` VARCHAR(191) NULL,
    ADD COLUMN `market_entry_id` VARCHAR(191) NULL,
    ADD INDEX `commission_entries_account_id_idx`(`account_id`),
    ADD INDEX `commission_entries_market_entry_id_idx`(`market_entry_id`),
    ADD CONSTRAINT `commission_entries_account_id_fkey`
        FOREIGN KEY (`account_id`) REFERENCES `admin_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `commission_entries_market_entry_id_fkey`
        FOREIGN KEY (`market_entry_id`) REFERENCES `market_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
