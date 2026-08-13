ALTER TABLE public.caregivers
  ADD COLUMN IF NOT EXISTS preferred_hours text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS availability_negotiable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hours_negotiable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_negotiable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rate_negotiable boolean NOT NULL DEFAULT false;