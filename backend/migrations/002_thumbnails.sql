ALTER TABLE application_photos ADD COLUMN IF NOT EXISTS thumb bytea;
CREATE INDEX IF NOT EXISTS applications_filters_idx ON applications(status, age_group, gender, created_at DESC);
