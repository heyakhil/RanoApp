ALTER TABLE `markets`
    ADD COLUMN `pending_close_cents` VARCHAR(2) NULL,
    ADD COLUMN `pending_close_seen_at` DATETIME(3) NULL;
