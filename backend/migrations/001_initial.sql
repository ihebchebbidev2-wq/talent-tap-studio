BEGIN;
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY,
  reference text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL, phone text NOT NULL,
  age_group text NOT NULL, gender text NOT NULL, city text NOT NULL,
  social_url text NOT NULL DEFAULT '', experience boolean,
  interests text[] NOT NULL DEFAULT '{}', video_url text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '', consent boolean NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','shortlisted','rejected'))
);
CREATE TABLE IF NOT EXISTS application_photos (
  id uuid PRIMARY KEY, application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  position smallint NOT NULL, image bytea NOT NULL, mime text NOT NULL DEFAULT 'image/jpeg',
  UNIQUE(application_id, position)
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash text PRIMARY KEY, expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS applications_date_idx ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON admin_sessions(expires_at);
COMMIT;