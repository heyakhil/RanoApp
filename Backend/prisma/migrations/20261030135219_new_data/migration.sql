-- AlterTable
ALTER TABLE `payment_destinations` MODIFY `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    MODIFY `qr_image_url` TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX `admin_accounts_role_idx` ON `admin_accounts`(`role`);
