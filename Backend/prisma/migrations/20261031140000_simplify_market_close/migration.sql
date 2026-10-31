-- Some installations already removed these columns manually. Keep this
-- migration safe in either state while clearing any old unverified closes.
SET @marketCloseVerifiedExists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'markets'
    AND COLUMN_NAME = 'session_close_verified'
);
SET @marketCloseSql = IF(@marketCloseVerifiedExists > 0,
  'UPDATE `markets` SET `session_close_at` = NULL, `close_time` = NULL, `last_close_fetch_at` = NULL WHERE `session_close_verified` = FALSE',
  'SELECT 1');
PREPARE marketCloseStatement FROM @marketCloseSql;
EXECUTE marketCloseStatement;
DEALLOCATE PREPARE marketCloseStatement;

SET @marketCloseSql = IF(@marketCloseVerifiedExists > 0,
  'ALTER TABLE `markets` DROP COLUMN `session_close_verified`', 'SELECT 1');
PREPARE marketCloseStatement FROM @marketCloseSql;
EXECUTE marketCloseStatement;
DEALLOCATE PREPARE marketCloseStatement;

SET @marketCloseAttemptExists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'markets'
    AND COLUMN_NAME = 'close_verification_attempt_at'
);
SET @marketCloseSql = IF(@marketCloseAttemptExists > 0,
  'ALTER TABLE `markets` DROP COLUMN `close_verification_attempt_at`', 'SELECT 1');
PREPARE marketCloseStatement FROM @marketCloseSql;
EXECUTE marketCloseStatement;
DEALLOCATE PREPARE marketCloseStatement;
