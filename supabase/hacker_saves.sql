-- Run in Supabase SQL Editor (Dashboard → SQL Editor)

CREATE TABLE IF NOT EXISTS "IDI_Accounts".hacker_saves (
  user_id    UUID PRIMARY KEY REFERENCES "IDI_Accounts".profiles(user_id) ON DELETE CASCADE,
  data       JSONB        NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION save_hacker(p_user_id UUID, p_data JSONB)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO "IDI_Accounts".hacker_saves (user_id, data, updated_at)
  VALUES (p_user_id, p_data, NOW())
  ON CONFLICT (user_id) DO UPDATE SET data = p_data, updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION load_hacker(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_data JSONB;
BEGIN
  SELECT data INTO v_data FROM "IDI_Accounts".hacker_saves WHERE user_id = p_user_id;
  RETURN v_data;
END;
$$;

GRANT EXECUTE ON FUNCTION save_hacker(UUID, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION load_hacker(UUID)        TO anon, authenticated;
