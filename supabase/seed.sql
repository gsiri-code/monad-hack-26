-- Seed: realistic demo data for Monad Hack 26
-- Run against your Supabase project via the SQL editor or:
--   supabase db reset  (picks this up automatically)
--   psql $DATABASE_URL -f supabase/seed.sql

-- ─────────────────────────────────────────────
-- USERS  (6 demo accounts)
-- ─────────────────────────────────────────────
INSERT INTO public.users (uid, username, wallet_address, phone_number, first_name, last_name, email, encryption_public_key, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'alex_m',    '0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b', '+14155550101', 'Alex',    'Monroe',   'alex@demo.monad',    'BKwj2pXsQ1TvYkLmNrFcHgOuZdAeIwCxVbSnPtDqGhMo', now() - interval '30 days'),
  ('a2000000-0000-0000-0000-000000000002', 'priya_k',   '0x2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c', '+14155550102', 'Priya',   'Kapoor',   'priya@demo.monad',   'BNzQ8mRwXvJkYpLsTuFcHgIaEdCbWoAnVxPrGhKjMnOq', now() - interval '28 days'),
  ('a3000000-0000-0000-0000-000000000003', 'marcus_j',  '0x3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d', '+14155550103', 'Marcus',  'Johnson',  'marcus@demo.monad',  NULL,                                             now() - interval '25 days'),
  ('a4000000-0000-0000-0000-000000000004', 'sara_l',    '0x4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e', '+14155550104', 'Sara',    'Lin',      'sara@demo.monad',    'BOxT5nSvYuKqZpMwRcFbHgJaDeCiWlAnVxPs GhLkNrOt', now() - interval '20 days'),
  ('a5000000-0000-0000-0000-000000000005', 'dev_r',     '0x5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E4f', '+14155550105', 'Dev',     'Rao',      'dev@demo.monad',     'BPyU6oTwZvLrAqNxScGbIhKbEfDjXmBnWyQtHiMlOpPs', now() - interval '15 days'),
  ('a6000000-0000-0000-0000-000000000006', 'nina_w',    '0x6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a', '+14155550106', 'Nina',    'Walsh',    'nina@demo.monad',    NULL,                                             now() - interval '10 days')
ON CONFLICT (uid) DO NOTHING;

-- ─────────────────────────────────────────────
-- FRIENDSHIPS  (mutual pairs stored once each)
-- ─────────────────────────────────────────────
INSERT INTO public.friendships (uid, user_a, user_b, created_at)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', now() - interval '27 days'),
  ('f2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', now() - interval '24 days'),
  ('f3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', now() - interval '14 days'),
  ('f4000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', now() - interval '22 days'),
  ('f5000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', now() - interval '18 days'),
  ('f6000000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000005', now() - interval '12 days'),
  ('f7000000-0000-0000-0000-000000000007', 'a4000000-0000-0000-0000-000000000004', 'a6000000-0000-0000-0000-000000000006', now() - interval '9 days'),
  ('f8000000-0000-0000-0000-000000000008', 'a5000000-0000-0000-0000-000000000005', 'a6000000-0000-0000-0000-000000000006', now() - interval '7 days')
ON CONFLICT (uid) DO NOTHING;

-- ─────────────────────────────────────────────
-- TRANSACTIONS  (settled public transfers)
-- ─────────────────────────────────────────────
INSERT INTO public.transactions (uid, sender, receiver, amount, ts, status, message)
VALUES
  -- Alex pays Priya for dinner
  ('t1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 25.5,   now() - interval '26 days', 'success', 'Dinner at Noma'),
  -- Marcus pays Alex back for concert tickets
  ('t2000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 120.0,  now() - interval '23 days', 'success', 'Concert tickets'),
  -- Priya sends Sara coffee money
  ('t3000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', 8.75,   now() - interval '19 days', 'success', 'Coffee run ☕'),
  -- Dev pays Alex for shared subscription
  ('t4000000-0000-0000-0000-000000000004', 'a5000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 5.0,    now() - interval '13 days', 'success', 'Spotify split'),
  -- Alex pays Dev for Uber
  ('t5000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 18.25,  now() - interval '8 days',  'success', 'Uber home'),
  -- Nina pays Sara — still pending
  ('t6000000-0000-0000-0000-000000000006', 'a6000000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000004', 50.0,   now() - interval '2 days',  'pending', 'Rent split'),
  -- Failed tx example
  ('t7000000-0000-0000-0000-000000000007', 'a3000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 200.0,  now() - interval '1 day',   'failure', NULL)
ON CONFLICT (uid) DO NOTHING;

-- ─────────────────────────────────────────────
-- PRIVATE TRANSACTIONS  (ECDH-encrypted)
-- Ciphertext/nonce are plausible base64 placeholders
-- ─────────────────────────────────────────────
INSERT INTO public.private_transactions (uid, sender, receiver, ciphertext, nonce, sender_pubkey_used, ts, status)
VALUES
  (
    'p1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'a2000000-0000-0000-0000-000000000002',
    'c2FtcGxlY2lwaGVydGV4dGZvcnByaXZhdGV0eA==',
    'bm9uY2UxMjM0NTY3ODkwYWJjZGVm',
    'BKwj2pXsQ1TvYkLmNrFcHgOuZdAeIwCxVbSnPtDqGhMo',
    now() - interval '21 days',
    'success'
  ),
  (
    'p2000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'cHJpdmF0ZXR4Y2lwaGVydGV4dHR3bw==',
    'bm9uY2VhYmNkZWYxMjM0NTY3ODkw',
    'BNzQ8mRwXvJkYpLsTuFcHgIaEdCbWoAnVxPrGhKjMnOq',
    now() - interval '11 days',
    'success'
  ),
  (
    'p3000000-0000-0000-0000-000000000003',
    'a5000000-0000-0000-0000-000000000005',
    'a3000000-0000-0000-0000-000000000003',
    'dGhpcmRwcml2YXRlY2lwaGVydGV4dA==',
    'bm9uY2V4eXoxMjM0NTY3ODkwYWJj',
    'BPyU6oTwZvLrAqNxScGbIhKbEfDjXmBnWyQtHiMlOpPs',
    now() - interval '4 days',
    'pending'
  )
ON CONFLICT (uid) DO NOTHING;

-- ─────────────────────────────────────────────
-- REQUESTS  (payment requests, various statuses)
-- ─────────────────────────────────────────────
INSERT INTO public.requests (uid, sender, receiver, amount, ts, status, message)
VALUES
  -- Alex requested money from Marcus (accepted)
  ('r1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 60.0,  now() - interval '22 days', 'accepted',  'Half of the Airbnb'),
  -- Priya requested from Sara (open)
  ('r2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', 15.0,  now() - interval '10 days', 'open',      'Groceries 🛒'),
  -- Marcus requested from Alex (rejected)
  ('r3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 300.0, now() - interval '16 days', 'rejected',  'Old debt'),
  -- Dev requested from Nina (open)
  ('r4000000-0000-0000-0000-000000000004', 'a5000000-0000-0000-0000-000000000005', 'a6000000-0000-0000-0000-000000000006', 40.0,  now() - interval '5 days',  'open',      'Bowling + pizza 🎳'),
  -- Nina requested from Sara (cancelled)
  ('r5000000-0000-0000-0000-000000000005', 'a6000000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000004', 22.5,  now() - interval '8 days',  'cancelled', NULL),
  -- Sara requested from Alex (expired)
  ('r6000000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 10.0,  now() - interval '20 days', 'expired',   'Coffee last week')
ON CONFLICT (uid) DO NOTHING;
