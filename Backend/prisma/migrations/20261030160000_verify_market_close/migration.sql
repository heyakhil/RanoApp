ALTER TABLE `markets`
  ADD COLUMN `session_close_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN `close_verification_attempt_at` DATETIME(3) NULL;

-- Existing closes have no reliable provenance. Re-fetch them before allowing
-- another bet or settlement; an earlier fetch attempt alone is not proof.
