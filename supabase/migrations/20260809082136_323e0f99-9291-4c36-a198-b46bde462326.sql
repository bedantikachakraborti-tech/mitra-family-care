CREATE TABLE public.caregivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  initials text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  about text NOT NULL DEFAULT '',
  years_experience int NOT NULL DEFAULT 0,
  languages text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  area text NOT NULL DEFAULT '',
  availability text NOT NULL DEFAULT '',
  hourly_rate int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caregivers TO anon, authenticated;
GRANT ALL ON public.caregivers TO service_role;
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo open access to caregivers" ON public.caregivers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.care_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  raw_description text NOT NULL DEFAULT '',
  structured jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_caregiver_id uuid REFERENCES public.caregivers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_requests TO anon, authenticated;
GRANT ALL ON public.care_requests TO service_role;
ALTER TABLE public.care_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo open access to care requests" ON public.care_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.caregiver_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.care_requests(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  rationale text NOT NULL DEFAULT '',
  considerations text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, caregiver_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caregiver_matches TO anon, authenticated;
GRANT ALL ON public.caregiver_matches TO service_role;
ALTER TABLE public.caregiver_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo open access to matches" ON public.caregiver_matches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.care_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.care_requests(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_plans TO anon, authenticated;
GRANT ALL ON public.care_plans TO service_role;
ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo open access to care plans" ON public.care_plans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.care_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.care_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  details text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'routine',
  time_of_day text NOT NULL DEFAULT 'morning',
  scheduled_time text NOT NULL DEFAULT '',
  days text[] NOT NULL DEFAULT '{mon,tue,wed,thu,fri,sat,sun}',
  is_active boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_tasks TO anon, authenticated;
GRANT ALL ON public.care_tasks TO service_role;
ALTER TABLE public.care_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo open access to care tasks" ON public.care_tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.task_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.care_tasks(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'pending',
  note text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_logs TO anon, authenticated;
GRANT ALL ON public.task_logs TO service_role;
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo open access to task logs" ON public.task_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.day_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.care_plans(id) ON DELETE CASCADE,
  summary_date date NOT NULL DEFAULT current_date,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, summary_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_summaries TO anon, authenticated;
GRANT ALL ON public.day_summaries TO service_role;
ALTER TABLE public.day_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo open access to day summaries" ON public.day_summaries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.caregivers (name, initials, headline, about, years_experience, languages, skills, area, availability, hourly_rate) VALUES
('Priya Nair', 'PN', 'Home caregiver for elders', 'I care for elders the way I cared for my own grandmother — patiently, with a lot of laughter and a steady eye on routines.', 6, ARRAY['Malayalam','English','Kannada'], ARRAY['Dementia care','Meal prep','Mobility assistance','Medication reminders','Companionship'], 'Indiranagar, Bengaluru', 'Weekdays, 8:00 - 18:00', 320),
('Ramesh Gowda', 'RG', 'Attendant and mobility support', 'Ten years supporting people after surgery and stroke. Calm, unhurried, and good at gentle exercise routines.', 10, ARRAY['Kannada','Hindi','English'], ARRAY['Post-surgery recovery','Physiotherapy support','Mobility assistance','Doctor visits'], 'Domlur, Bengaluru', 'Weekdays and Saturdays, 7:00 - 16:00', 380),
('Fatima Sheikh', 'FS', 'Live-in caregiver', 'I focus on daily rhythm — meals on time, medicines on time, and a proper chat over tea every afternoon.', 8, ARRAY['Hindi','Urdu','English'], ARRAY['Live-in care','Cooking','Housekeeping','Medication reminders','Companionship'], 'Koramangala, Bengaluru', 'Live-in, 5 days a week', 450),
('Anjali Deshpande', 'AD', 'Companion caregiver', 'Reading aloud, music, walks and long conversations. Best suited to elders who mostly need company and light help.', 3, ARRAY['Marathi','English','Hindi'], ARRAY['Companionship','Light housekeeping','Walks','Reading aloud'], 'Indiranagar, Bengaluru', 'Afternoons, Mon - Sat', 240),
('Joseph Fernandes', 'JF', 'Night attendant', 'Overnight care and early mornings. I keep detailed notes so the family always knows how the night went.', 5, ARRAY['Konkani','English','Kannada'], ARRAY['Overnight care','Mobility assistance','Medication reminders','Note keeping'], 'HSR Layout, Bengaluru', 'Nights, 20:00 - 7:00', 400),
('Lakshmi Iyer', 'LI', 'Caregiver and home cook', 'South Indian home cooking and dependable daily routines. I have supported four families with diabetes-friendly meals.', 7, ARRAY['Tamil','Kannada','English'], ARRAY['Cooking','Diet-aware meals','Housekeeping','Companionship','Medication reminders'], 'Jayanagar, Bengaluru', 'Mornings, Mon - Sat', 300);