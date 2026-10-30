-- Read-only checks for a settled round with zero participants or an order
-- that remains pending. Run against the production database before repairing.
SELECT r.market_id, m.name, m.country_code, r.round_number,
       r.session_close_at AS recorded_close_at, r.settled_at,
       m.session_close_at AS current_close_at, m.last_close_fetch_at,
       m.last_quote_fetch_at, r.participant_count, r.total_bet_amount
FROM market_rounds r
JOIN markets m ON m.id = r.market_id
ORDER BY r.settled_at DESC
LIMIT 20;

SELECT r.market_id, m.name, r.round_number, r.status, r.result,
       r.participant_count AS recorded_participants,
       r.total_bet_amount AS recorded_bet_amount,
       COUNT(e.id) AS actual_participants,
       COALESCE(SUM(e.amount), 0) AS actual_bet_amount,
       r.session_close_at, r.settled_at
FROM market_rounds r
JOIN markets m ON m.id = r.market_id
LEFT JOIN market_entries e
  ON e.market_id = r.market_id AND e.round_number = r.round_number
GROUP BY r.id, r.market_id, m.name, r.round_number, r.status, r.result,
         r.participant_count, r.total_bet_amount, r.session_close_at, r.settled_at
HAVING recorded_participants <> actual_participants
    OR recorded_bet_amount <> actual_bet_amount
ORDER BY r.settled_at DESC;

-- Bets without an exact result row, including bets left in an older round.
SELECT e.market_id, m.name, e.round_number, m.current_round,
       COUNT(*) AS bets, SUM(e.amount) AS bet_amount,
       MIN(e.created_at) AS first_bet_at, MAX(e.created_at) AS last_bet_at,
       m.session_close_at, m.last_settled_close
FROM market_entries e
JOIN markets m ON m.id = e.market_id
LEFT JOIN market_rounds r
  ON r.market_id = e.market_id AND r.round_number = e.round_number
WHERE r.id IS NULL
GROUP BY e.market_id, m.name, e.round_number, m.current_round,
         m.session_close_at, m.last_settled_close
ORDER BY first_bet_at DESC;
