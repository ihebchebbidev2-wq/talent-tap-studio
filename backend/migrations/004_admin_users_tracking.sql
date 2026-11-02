BEGIN;
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY, username text UNIQUE NOT NULL,
  password_hash text NOT NULL, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_user_roles (
  user_id uuid PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('viewer','full'))
);
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES admin_users(id) ON DELETE CASCADE;
DELETE FROM admin_sessions WHERE user_id IS NULL;
ALTER TABLE admin_sessions ALTER COLUMN user_id SET NOT NULL;
CREATE TABLE IF NOT EXISTS tracking_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  pixel_id text NOT NULL DEFAULT '', enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO tracking_settings(singleton) VALUES (true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS advertising_consent (
  id uuid PRIMARY KEY, visitor_id uuid NOT NULL,
  accepted boolean NOT NULL, region text NOT NULL,
  notice_version text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS advertising_consent_visitor_idx ON advertising_consent(visitor_id,created_at DESC);
COMMIT;