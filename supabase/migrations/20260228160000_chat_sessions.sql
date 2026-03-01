CREATE TABLE chat_sessions (
  session_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uid                 UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  access_token_encrypted   TEXT NOT NULL,
  refresh_token_encrypted  TEXT NOT NULL,
  access_expires_at        TIMESTAMPTZ NOT NULL,
  last_used_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  status                   TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'reauth_required', 'revoked'))
);

CREATE INDEX idx_chat_sessions_user_uid ON chat_sessions (user_uid);
