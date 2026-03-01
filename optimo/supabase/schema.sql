-- Benmo Database Schema
-- Run this in the Supabase SQL Editor to create all tables.

-- Users: maps wallet addresses to display names
CREATE TABLE IF NOT EXISTS users (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address  TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Friends: bidirectional friend relationships
CREATE TABLE IF NOT EXISTS friends (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Social feed: payment metadata WITHOUT amount (privacy preserved)
CREATE TABLE IF NOT EXISTS social_feed (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender      TEXT NOT NULL,
  receiver    TEXT NOT NULL,
  memo        TEXT NOT NULL,
  visibility  TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  tx_hash     TEXT,
  relay_id    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- CRITICAL: No 'amount' column. This is intentional for privacy.

CREATE INDEX IF NOT EXISTS idx_social_feed_sender ON social_feed(sender);
CREATE INDEX IF NOT EXISTS idx_social_feed_receiver ON social_feed(receiver);
CREATE INDEX IF NOT EXISTS idx_social_feed_created ON social_feed(created_at DESC);
