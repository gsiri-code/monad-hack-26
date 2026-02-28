create extension if not exists pgcrypto;

create table if not exists users (
  uid uuid primary key default gen_random_uuid(),
  username text not null unique,
  wallet_address text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  uid uuid primary key default gen_random_uuid(),
  sender uuid not null references users(uid) on delete restrict,
  receiver uuid not null references users(uid) on delete restrict,
  amount numeric(78, 18) not null check (amount > 0),
  ts timestamptz not null default now(),
  status text not null check (status in ('pending', 'success', 'failure')),
  message text,

  check (sender <> receiver)
);

create index if not exists idx_transactions_sender_ts on transactions (sender, ts desc);
create index if not exists idx_transactions_receiver_ts on transactions (receiver, ts desc);
create index if not exists idx_transactions_status_ts on transactions (status, ts desc);

create table if not exists requests (
  uid uuid primary key default gen_random_uuid(),
  sender uuid not null references users(uid) on delete restrict,
  receiver uuid not null references users(uid) on delete restrict,
  amount numeric(78, 18) not null check (amount > 0),
  ts timestamptz not null default now(),
  status text not null check (status in ('open', 'accepted', 'rejected', 'cancelled', 'expired')),
  message text,

  check (sender <> receiver)
);

create index if not exists idx_requests_sender_ts on requests (sender, ts desc);
create index if not exists idx_requests_receiver_ts on requests (receiver, ts desc);
create index if not exists idx_requests_status_ts on requests (status, ts desc);
