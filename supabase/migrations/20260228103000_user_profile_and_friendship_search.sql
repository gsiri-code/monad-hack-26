CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE users
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL,
ALTER COLUMN password_hash SET NOT NULL,
ALTER COLUMN phone_number SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_first_name_not_blank'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_first_name_not_blank CHECK (btrim(first_name) <> '');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_last_name_not_blank'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_last_name_not_blank CHECK (btrim(last_name) <> '');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_phone_number_not_blank'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_phone_number_not_blank CHECK (btrim(phone_number) <> '');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_password_hash_not_blank'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_password_hash_not_blank CHECK (btrim(password_hash) <> '');
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique
ON users (lower(email))
WHERE email IS NOT NULL;

CREATE OR REPLACE FUNCTION normalize_phone(input TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(COALESCE(input, '')), '[^a-z0-9]', '', 'g');
$$;

CREATE INDEX IF NOT EXISTS idx_users_username_trgm
ON users USING gin (lower(username) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_phone_number_trgm
ON users USING gin (normalize_phone(phone_number) gin_trgm_ops);

CREATE OR REPLACE FUNCTION list_user_friendships(
  p_user_uid UUID,
  p_username TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  friendship_uid UUID,
  created_at TIMESTAMPTZ,
  friend_uid UUID,
  username TEXT,
  wallet_address TEXT,
  phone_number TEXT
)
LANGUAGE SQL
STABLE
AS $$
  WITH scoped_friendships AS (
    SELECT
      f.uid,
      f.created_at,
      CASE
        WHEN f.user_a = p_user_uid THEN f.user_b
        ELSE f.user_a
      END AS friend_uid
    FROM friendships f
    WHERE f.user_a = p_user_uid OR f.user_b = p_user_uid
  )
  SELECT
    sf.uid AS friendship_uid,
    sf.created_at,
    u.uid AS friend_uid,
    u.username,
    u.wallet_address,
    u.phone_number
  FROM scoped_friendships sf
  JOIN users u ON u.uid = sf.friend_uid
  WHERE
    (
      p_username IS NULL
      OR btrim(p_username) = ''
      OR lower(u.username) % lower(p_username)
      OR lower(u.username) LIKE '%' || lower(p_username) || '%'
    )
    AND (
      p_phone IS NULL
      OR btrim(p_phone) = ''
      OR normalize_phone(u.phone_number) LIKE '%' || normalize_phone(p_phone) || '%'
    )
  ORDER BY sf.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
$$;
