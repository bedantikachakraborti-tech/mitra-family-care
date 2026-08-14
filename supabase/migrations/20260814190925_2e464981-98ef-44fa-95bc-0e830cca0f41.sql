-- 1. Buffer period on tasks (family-owned)
ALTER TABLE public.care_tasks ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 30;

CREATE OR REPLACE FUNCTION public.validate_task_buffer()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.buffer_minutes < 10 THEN NEW.buffer_minutes := 10; END IF;
  IF NEW.buffer_minutes > 60 THEN NEW.buffer_minutes := 60; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS validate_task_buffer_trg ON public.care_tasks;
CREATE TRIGGER validate_task_buffer_trg BEFORE INSERT OR UPDATE ON public.care_tasks
FOR EACH ROW EXECUTE FUNCTION public.validate_task_buffer();

-- 2. Occurrence timing data
ALTER TABLE public.task_logs ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.task_logs ADD COLUMN IF NOT EXISTS outside_buffer boolean NOT NULL DEFAULT false;
ALTER TABLE public.task_logs ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- 3. Match lifecycle
ALTER TABLE public.care_requests ADD COLUMN IF NOT EXISTS match_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.care_requests ADD COLUMN IF NOT EXISTS unmatched_at timestamptz;
ALTER TABLE public.care_requests ADD COLUMN IF NOT EXISTS unmatched_by uuid;
UPDATE public.care_requests SET match_status = 'active' WHERE selected_caregiver_id IS NOT NULL AND match_status = 'pending';

CREATE OR REPLACE FUNCTION public.has_active_match(_request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_requests r
    WHERE r.id = _request_id
      AND r.match_status = 'active'
      AND r.selected_caregiver_id IS NOT NULL
      AND (r.family_user_id = auth.uid() OR r.selected_caregiver_id = public.my_caregiver_id())
  )
$$;

CREATE OR REPLACE FUNCTION public.request_counterpart(_request_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN r.family_user_id = auth.uid() THEN (SELECT c.user_id FROM public.caregivers c WHERE c.id = r.selected_caregiver_id)
    WHEN r.selected_caregiver_id = public.my_caregiver_id() THEN r.family_user_id
    ELSE NULL END
  FROM public.care_requests r WHERE r.id = _request_id
$$;

-- 4. Private chat
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.care_requests(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_request_idx ON public.messages(request_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read messages" ON public.messages FOR SELECT TO authenticated
  USING (public.can_access_request(request_id));
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_user_id = auth.uid() AND public.has_active_match(request_id));
CREATE POLICY "Recipients mark messages read" ON public.messages FOR UPDATE TO authenticated
  USING (public.can_access_request(request_id)) WITH CHECK (public.can_access_request(request_id));

-- 5. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_id uuid REFERENCES public.care_requests(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  dedupe_key text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users update their notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Care circle creates notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR (request_id IS NOT NULL AND public.can_access_request(request_id) AND user_id = public.request_counterpart(request_id)));

-- 6. Mutual reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.care_requests(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL,
  reviewee_user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  categories text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, reviewer_user_id)
);
CREATE INDEX IF NOT EXISTS reviews_reviewee_idx ON public.reviews(reviewee_user_id);
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read reviews" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Participants write their review" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_user_id = auth.uid() AND public.can_access_request(request_id) AND reviewee_user_id = public.request_counterpart(request_id) AND reviewee_user_id <> auth.uid());
CREATE POLICY "Authors edit their review" ON public.reviews FOR UPDATE TO authenticated
  USING (reviewer_user_id = auth.uid()) WITH CHECK (reviewer_user_id = auth.uid());
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Notification preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_prompted boolean NOT NULL DEFAULT false;

-- 8. New task records only while the relationship is active
DROP POLICY IF EXISTS "Write logs for accessible tasks" ON public.task_logs;
CREATE POLICY "Write logs for active relationships" ON public.task_logs FOR INSERT TO authenticated
  WITH CHECK (public.owns_request(public.task_request(task_id)) OR public.has_active_match(public.task_request(task_id)));
DROP POLICY IF EXISTS "Update logs for accessible tasks" ON public.task_logs;
CREATE POLICY "Update logs for active relationships" ON public.task_logs FOR UPDATE TO authenticated
  USING (public.owns_request(public.task_request(task_id)) OR public.has_active_match(public.task_request(task_id)))
  WITH CHECK (public.owns_request(public.task_request(task_id)) OR public.has_active_match(public.task_request(task_id)));