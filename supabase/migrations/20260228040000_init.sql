CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users: identity + wallet mapping
CREATE TABLE users (
  uid            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- transactions: settled transfers between users
CREATE TABLE transactions (
  uid        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender     UUID NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
  receiver   UUID NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
  amount     NUMERIC(78, 18) NOT NULL CHECK (amount > 0),
  ts         TIMESTAMPTZ NOT NULL DEFAULT now(),
  status     TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failure')),
  message    TEXT,

  CHECK (sender <> receiver)
);

CREATE INDEX idx_transactions_sender_ts   ON transactions (sender, ts DESC);
CREATE INDEX idx_transactions_receiver_ts ON transactions (receiver, ts DESC);
CREATE INDEX idx_transactions_status_ts   ON transactions (status, ts DESC);

-- requests: intent to pay / trade request before settlement
CREATE TABLE requests (
  uid        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender     UUID NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
  receiver   UUID NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
  amount     NUMERIC(78, 18) NOT NULL CHECK (amount > 0),
  ts         TIMESTAMPTZ NOT NULL DEFAULT now(),
  status     TEXT NOT NULL CHECK (status IN ('open', 'accepted', 'rejected', 'cancelled', 'expired')),
  message    TEXT,

  CHECK (sender <> receiver)
);

CREATE INDEX idx_requests_sender_ts   ON requests (sender, ts DESC);
CREATE INDEX idx_requests_receiver_ts ON requests (receiver, ts DESC);
CREATE INDEX idx_requests_status_ts   ON requests (status, ts DESC);
