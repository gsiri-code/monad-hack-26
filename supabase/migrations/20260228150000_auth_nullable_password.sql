ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_password_hash_not_blank;
ALTER TABLE users ADD CONSTRAINT users_password_hash_not_blank
  CHECK (password_hash IS NULL OR btrim(password_hash) <> '');
