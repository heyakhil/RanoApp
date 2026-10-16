CREATE TABLE `payment_destinations` (
    `id` VARCHAR(191) NOT NULL,
    `upi_id` VARCHAR(255) NOT NULL,
    `qr_image_url` TEXT NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
