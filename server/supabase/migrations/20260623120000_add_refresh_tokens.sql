-- Author: <hashinijayarathne2003-beep>

-- ===== REFRESH TOKENS (for token rotation and revocation) =====
CREATE TABLE refresh_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index to query user's tokens quickly
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
