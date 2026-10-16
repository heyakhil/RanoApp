-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `firebase_uid` VARCHAR(128) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `photo_url` TEXT NULL,
    `name` VARCHAR(120) NULL,
    `mobile` VARCHAR(20) NULL,
    `dob` DATE NULL,
    `gender` ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
    `is_profile_complete` BOOLEAN NOT NULL DEFAULT false,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_firebase_uid_key`(`firebase_uid`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_is_profile_complete_idx`(`is_profile_complete`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

