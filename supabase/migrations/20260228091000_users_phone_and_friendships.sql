ALTER TABLE users
ADD COLUMN phone_number TEXT;

CREATE UNIQUE INDEX idx_users_phone_number_unique
ON users (phone_number)
WHERE phone_number IS NOT NULL;

CREATE TABLE friendships (
  uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (user_a <> user_b),
  CHECK (user_a < user_b),

  UNIQUE (user_a, user_b)
);

CREATE INDEX idx_friendships_user_a_created_at ON friendships (user_a, created_at DESC);
CREATE INDEX idx_friendships_user_b_created_at ON friendships (user_b, created_at DESC);
