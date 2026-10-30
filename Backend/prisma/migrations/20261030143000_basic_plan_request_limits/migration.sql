ALTER TABLE `markets`
  ADD COLUMN `quote_fetch_attempts` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `last_quote_fetch_at` DATETIME(3) NULL;
