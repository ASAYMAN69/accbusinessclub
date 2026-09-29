-- Add new contact/social columns + enforce conditional rules
-- Run once in Supabase SQL editor (SQL tab).

ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS wp_number text;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS fb_id text;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS prev_club_name text;

-- 1) wp_number required (app enforces; make it NOT NULL after verifying no NULLs)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.registrations WHERE wp_number IS NULL) THEN
    RAISE NOTICE 'BACKFILL NEEDED: wp_number has NULL rows — backfill before NOT NULL';
  END IF;
END $$;
-- Uncomment after backfill:
-- ALTER TABLE public.registrations ALTER COLUMN wp_number SET NOT NULL;

ALTER TABLE public.registrations ADD CONSTRAINT IF NOT EXISTS registrations_wp_number_format_check
  CHECK (wp_number IS NULL OR wp_number ~ '^\+[1-9][0-9]{7,14}$');

ALTER TABLE public.registrations ADD CONSTRAINT IF NOT EXISTS registrations_fb_id_format_check
  CHECK (fb_id IS NULL OR fb_id ~ '^https://(facebook\.com|m\.facebook\.com|fb\.com)/[A-Za-z0-9._-]{1,64}$');

ALTER TABLE public.registrations ADD CONSTRAINT IF NOT EXISTS registrations_prev_club_name_check
  CHECK (prev_club_name IS NULL OR prev_club_name ~ '^[A-Za-z0-9 ().,:]{1,256}$');

ALTER TABLE public.registrations ADD CONSTRAINT IF NOT EXISTS registrations_name_of_clubs_check
  CHECK (name_of_clubs IS NULL OR name_of_clubs ~ '^[A-Za-z0-9 ().,:]{1,256}$');

ALTER TABLE public.registrations ADD CONSTRAINT IF NOT EXISTS registrations_joined_clubs_name_check
  CHECK ((joined_clubs = false AND (name_of_clubs IS NULL OR name_of_clubs = ''))
      OR (joined_clubs = true AND name_of_clubs IS NOT NULL AND length(btrim(name_of_clubs)) > 0));

ALTER TABLE public.registrations ADD CONSTRAINT IF NOT EXISTS registrations_prev_club_name_cond_check
  CHECK ((prev_club = false AND (prev_club_name IS NULL OR prev_club_name = ''))
      OR (prev_club = true AND prev_club_name IS NOT NULL AND length(btrim(prev_club_name)) > 0));

CREATE INDEX IF NOT EXISTS registrations_wp_number_idx ON public.registrations (wp_number);
