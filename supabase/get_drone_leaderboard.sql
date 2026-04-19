-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Adjust the FROM clause if the drone saves table lives in a different schema/name.
-- To find the table: check the existing save_drone function body in your Supabase dashboard.

CREATE OR REPLACE FUNCTION get_drone_leaderboard()
RETURNS TABLE (
  username       TEXT,
  research_count INT,
  farm_size      INT,
  hay            INT,
  wood           INT,
  carrot         INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.username::TEXT,
    COALESCE(jsonb_array_length(d.data->'bought'), 0)::INT   AS research_count,
    CASE
      WHEN d.data->'bought' ? 'expand2' THEN 7
      WHEN d.data->'bought' ? 'expand1' THEN 5
      ELSE 3
    END::INT                                                  AS farm_size,
    COALESCE((d.data->'inv'->>'hay')::FLOAT::INT,    0)      AS hay,
    COALESCE((d.data->'inv'->>'wood')::FLOAT::INT,   0)      AS wood,
    COALESCE((d.data->'inv'->>'carrot')::FLOAT::INT, 0)      AS carrot
  FROM "IDI_Accounts".drone_saves d
  JOIN "IDI_Accounts".profiles    p ON p.user_id = d.user_id
  WHERE (d.data->>'storyDone')::BOOLEAN = TRUE
  ORDER BY research_count DESC, farm_size DESC
  LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION get_drone_leaderboard() TO anon, authenticated;
