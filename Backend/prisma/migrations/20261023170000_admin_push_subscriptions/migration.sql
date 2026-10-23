CREATE TABLE `admin_push_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `admin_id` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(512) NOT NULL,
    `p256dh` VARCHAR(255) NOT NULL,
    `auth` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_push_subscriptions_endpoint_key`(`endpoint`),
    INDEX `admin_push_subscriptions_admin_id_idx`(`admin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `admin_push_subscriptions`
    ADD CONSTRAINT `admin_push_subscriptions_admin_id_fkey`
    FOREIGN KEY (`admin_id`) REFERENCES `admin_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
