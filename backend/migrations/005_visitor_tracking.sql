BEGIN;

CREATE TABLE IF NOT EXISTS visitor_events (
  id uuid PRIMARY KEY,
  visitor_id uuid NOT NULL,
  session_id uuid NOT NULL,
  event_type text NOT NULL,
  path text NOT NULL DEFAULT '/',
  region text NOT NULL DEFAULT 'XX',
  city text NOT NULL DEFAULT '',
  device text NOT NULL DEFAULT 'desktop',
  browser text NOT NULL DEFAULT '',
  referrer text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visitor_events_visitor_idx ON visitor_events(visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS visitor_events_session_idx ON visitor_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS visitor_events_type_idx ON visitor_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS visitor_events_created_idx ON visitor_events(created_at DESC);
CREATE INDEX IF NOT EXISTS visitor_events_region_idx ON visitor_events(region);

CREATE TABLE IF NOT EXISTS form_sessions (
  session_id uuid PRIMARY KEY,
  visitor_id uuid NOT NULL,
  region text NOT NULL DEFAULT 'XX',
  city text NOT NULL DEFAULT '',
  device text NOT NULL DEFAULT 'desktop',
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  last_step text NOT NULL DEFAULT 'start',
  completed_sections int NOT NULL DEFAULT 0,
  fields_filled text[] NOT NULL DEFAULT '{}',
  submitted boolean NOT NULL DEFAULT false,
  abandoned boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS form_sessions_visitor_idx ON form_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS form_sessions_status_idx ON form_sessions(submitted, abandoned, last_active_at DESC);
CREATE INDEX IF NOT EXISTS form_sessions_region_idx ON form_sessions(region);

COMMIT;
