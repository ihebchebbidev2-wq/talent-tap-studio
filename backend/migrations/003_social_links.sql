BEGIN;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS instagram_url text NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS facebook_url text NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS tiktok_url text NOT NULL DEFAULT '';

-- Preserve legacy links; copy recognized platform links without overwriting new data.
UPDATE applications SET instagram_url = social_url
WHERE instagram_url = '' AND social_url ~* '^https://([a-z0-9-]+\.)*instagram\.com/';
UPDATE applications SET facebook_url = social_url
WHERE facebook_url = '' AND social_url ~* '^https://([a-z0-9-]+\.)*facebook\.com/';
UPDATE applications SET tiktok_url = social_url
WHERE tiktok_url = '' AND social_url ~* '^https://([a-z0-9-]+\.)*tiktok\.com/';
COMMIT;