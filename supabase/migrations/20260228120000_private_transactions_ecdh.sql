ALTER TABLE users
ADD COLUMN IF NOT EXISTS encryption_public_key TEXT;

CREATE TABLE IF NOT EXISTS private_transactions (
  uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender UUID NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
  receiver UUID NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
  ciphertext TEXT NOT NULL,
  nonce TEXT NOT NULL,
  sender_pubkey_used TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failure')),

  CHECK (sender <> receiver)
);

CREATE INDEX IF NOT EXISTS idx_private_transactions_sender_ts
ON private_transactions (sender, ts DESC);

CREATE INDEX IF NOT EXISTS idx_private_transactions_receiver_ts
ON private_transactions (receiver, ts DESC);

CREATE INDEX IF NOT EXISTS idx_private_transactions_status_ts
ON private_transactions (status, ts DESC);
