-- 001: registration contact/social fields
-- Paste into Supabase SQL Editor. Idempotent — safe to re-run.

-- 1) New columns
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS wp_number text;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS fb_id text;

-- 2) Format + conditional constraints (idempotent: ADD CONSTRAINT has no IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_wp_number_format') THEN
    ALTER TABLE public.registrations ADD CONSTRAINT registrations_wp_number_format
      CHECK (wp_number IS NULL OR wp_number ~ '^\+[1-9][0-9]{7,14}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_fb_id_format') THEN
    ALTER TABLE public.registrations ADD CONSTRAINT registrations_fb_id_format
      CHECK (fb_id IS NULL OR fb_id ~ '^https://(facebook\.com|m\.facebook\.com|fb\.com)/[A-Za-z0-9._-]{1,64}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_name_of_clubs_charset') THEN
    ALTER TABLE public.registrations ADD CONSTRAINT registrations_name_of_clubs_charset
      CHECK (name_of_clubs IS NULL OR name_of_clubs ~ '^[A-Za-z0-9 ().,:]{1,256}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_joined_clubs_cond') THEN
    ALTER TABLE public.registrations ADD CONSTRAINT registrations_joined_clubs_cond
      CHECK (
        (joined_clubs = false AND (name_of_clubs IS NULL OR name_of_clubs = ''))
        OR (joined_clubs = true AND name_of_clubs IS NOT NULL AND length(btrim(name_of_clubs)) > 0)
      );
  END IF;
END $$;

-- 3) wp_number is required by the app. 3 legacy rows predate the column and hold NULL.
--    After you backfill them (SQL editor: SELECT * FROM public.registrations WHERE wp_number IS NULL),
--    uncomment the two lines below to hard-enforce NOT NULL:
-- UPDATE public.registrations SET wp_number = '+880...' WHERE wp_number IS NULL;  -- set real numbers
-- ALTER TABLE public.registrations ALTER COLUMN wp_number SET NOT NULL;

-- 4) Contact-list lookup index
CREATE INDEX IF NOT EXISTS registrations_wp_number_idx ON public.registrations (wp_number);
