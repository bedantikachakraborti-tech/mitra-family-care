-- 1. profiles ---------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('family', 'caregiver');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'family',
  full_name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  relationship text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own profile"
  ON public.profiles FOR ALL TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. new columns -------------------------------------------------------------
ALTER TABLE public.caregivers
  ADD COLUMN user_id uuid UNIQUE,
  ADD COLUMN certifications text[] NOT NULL DEFAULT '{}',
  ADD COLUMN specialties text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.care_requests ADD COLUMN family_user_id uuid;

ALTER TABLE public.task_logs
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN postponed_to text NOT NULL DEFAULT '';

-- 3. helper functions --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_caregiver_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.caregivers WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.owns_request(_request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_requests r
    WHERE r.id = _request_id AND r.family_user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_request(_request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_requests r
    WHERE r.id = _request_id
      AND (
        r.family_user_id = auth.uid()
        OR (r.selected_caregiver_id IS NOT NULL
            AND r.selected_caregiver_id = public.my_caregiver_id())
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.plan_request(_plan_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT request_id FROM public.care_plans WHERE id = _plan_id
$$;

CREATE OR REPLACE FUNCTION public.task_request(_task_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.plan_request(plan_id) FROM public.care_tasks WHERE id = _task_id
$$;

-- 4. replace demo policies ---------------------------------------------------
DROP POLICY IF EXISTS "Demo open access to caregivers" ON public.caregivers;
DROP POLICY IF EXISTS "Demo open access to care requests" ON public.care_requests;
DROP POLICY IF EXISTS "Demo open access to matches" ON public.caregiver_matches;
DROP POLICY IF EXISTS "Demo open access to care plans" ON public.care_plans;
DROP POLICY IF EXISTS "Demo open access to care tasks" ON public.care_tasks;
DROP POLICY IF EXISTS "Demo open access to task logs" ON public.task_logs;
DROP POLICY IF EXISTS "Demo open access to day summaries" ON public.day_summaries;

REVOKE ALL ON public.caregivers FROM anon;
REVOKE ALL ON public.care_requests FROM anon;
REVOKE ALL ON public.caregiver_matches FROM anon;
REVOKE ALL ON public.care_plans FROM anon;
REVOKE ALL ON public.care_tasks FROM anon;
REVOKE ALL ON public.task_logs FROM anon;
REVOKE ALL ON public.day_summaries FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.caregivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caregiver_matches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_summaries TO authenticated;

-- caregivers: readable by any signed-in user (matching), writable only by owner
CREATE POLICY "Signed-in users can read caregiver profiles"
  ON public.caregivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Caregivers create their own profile"
  ON public.caregivers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Caregivers edit their own profile"
  ON public.caregivers FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Caregivers delete their own profile"
  ON public.caregivers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- care_requests
CREATE POLICY "Family and matched caregiver read the request"
  ON public.care_requests FOR SELECT TO authenticated
  USING (family_user_id = auth.uid()
         OR (selected_caregiver_id IS NOT NULL
             AND selected_caregiver_id = public.my_caregiver_id()));
CREATE POLICY "Families create their own requests"
  ON public.care_requests FOR INSERT TO authenticated
  WITH CHECK (family_user_id = auth.uid());
CREATE POLICY "Families update their own requests"
  ON public.care_requests FOR UPDATE TO authenticated
  USING (family_user_id = auth.uid()) WITH CHECK (family_user_id = auth.uid());
CREATE POLICY "Families delete their own requests"
  ON public.care_requests FOR DELETE TO authenticated
  USING (family_user_id = auth.uid());

-- caregiver_matches
CREATE POLICY "Read matches for accessible requests"
  ON public.caregiver_matches FOR SELECT TO authenticated
  USING (public.can_access_request(request_id));
CREATE POLICY "Families write matches for their requests"
  ON public.caregiver_matches FOR INSERT TO authenticated
  WITH CHECK (public.owns_request(request_id));
CREATE POLICY "Families delete matches for their requests"
  ON public.caregiver_matches FOR DELETE TO authenticated
  USING (public.owns_request(request_id));

-- care_plans
CREATE POLICY "Read plans for accessible requests"
  ON public.care_plans FOR SELECT TO authenticated
  USING (public.can_access_request(request_id));
CREATE POLICY "Families create plans for their requests"
  ON public.care_plans FOR INSERT TO authenticated
  WITH CHECK (public.owns_request(request_id));
CREATE POLICY "Families delete plans for their requests"
  ON public.care_plans FOR DELETE TO authenticated
  USING (public.owns_request(request_id));

-- care_tasks
CREATE POLICY "Read tasks for accessible plans"
  ON public.care_tasks FOR SELECT TO authenticated
  USING (public.can_access_request(public.plan_request(plan_id)));
CREATE POLICY "Families create tasks in their plans"
  ON public.care_tasks FOR INSERT TO authenticated
  WITH CHECK (public.owns_request(public.plan_request(plan_id)));
CREATE POLICY "Families update tasks in their plans"
  ON public.care_tasks FOR UPDATE TO authenticated
  USING (public.owns_request(public.plan_request(plan_id)))
  WITH CHECK (public.owns_request(public.plan_request(plan_id)));
CREATE POLICY "Families delete tasks in their plans"
  ON public.care_tasks FOR DELETE TO authenticated
  USING (public.owns_request(public.plan_request(plan_id)));

-- task_logs: family and matched caregiver both record progress
CREATE POLICY "Read logs for accessible tasks"
  ON public.task_logs FOR SELECT TO authenticated
  USING (public.can_access_request(public.task_request(task_id)));
CREATE POLICY "Write logs for accessible tasks"
  ON public.task_logs FOR INSERT TO authenticated
  WITH CHECK (public.can_access_request(public.task_request(task_id)));
CREATE POLICY "Update logs for accessible tasks"
  ON public.task_logs FOR UPDATE TO authenticated
  USING (public.can_access_request(public.task_request(task_id)))
  WITH CHECK (public.can_access_request(public.task_request(task_id)));

-- day_summaries
CREATE POLICY "Read summaries for accessible plans"
  ON public.day_summaries FOR SELECT TO authenticated
  USING (public.can_access_request(public.plan_request(plan_id)));
CREATE POLICY "Write summaries for accessible plans"
  ON public.day_summaries FOR INSERT TO authenticated
  WITH CHECK (public.can_access_request(public.plan_request(plan_id)));
CREATE POLICY "Update summaries for accessible plans"
  ON public.day_summaries FOR UPDATE TO authenticated
  USING (public.can_access_request(public.plan_request(plan_id)))
  WITH CHECK (public.can_access_request(public.plan_request(plan_id)));