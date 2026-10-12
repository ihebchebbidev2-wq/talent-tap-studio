CREATE TABLE public.casting_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
 phone text NOT NULL CHECK (char_length(phone) BETWEEN 8 AND 25),
 age_group text NOT NULL CHECK (age_group IN ('18-24','25-34','35-49','50+')),
 gender text NOT NULL CHECK (gender IN ('male','female')),
 city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 100),
 social_url text NOT NULL DEFAULT '',
 experience boolean,
 interests text[] NOT NULL DEFAULT '{}',
 video_url text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 2000),
 photo_paths text[] NOT NULL CHECK (cardinality(photo_paths) BETWEEN 2 AND 3),
 consent boolean NOT NULL CHECK (consent = true),
 status text NOT NULL DEFAULT 'new'
);
GRANT ALL ON public.casting_applications TO service_role;
ALTER TABLE public.casting_applications ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.casting_applications IS 'Private casting submissions; accessible only to the reviewing team through Cloud.';