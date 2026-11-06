-- The existing (market_id, round_number) unique index guards each result.
-- Historical rows can share a session_on date, so preserve them.
DROP INDEX `market_rounds_market_id_settled_on_key` ON `market_rounds`;
