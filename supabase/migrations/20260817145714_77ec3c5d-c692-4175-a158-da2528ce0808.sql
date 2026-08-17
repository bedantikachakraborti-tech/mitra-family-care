CREATE OR REPLACE FUNCTION public.end_care_match(_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _counterpart uuid;
BEGIN
  IF NOT public.can_access_request(_request_id) THEN
    RAISE EXCEPTION 'Not allowed to change this care connection';
  END IF;

  SELECT public.request_counterpart(_request_id) INTO _counterpart;

  UPDATE public.care_requests
     SET match_status = 'unmatched',
         unmatched_at = now(),
         unmatched_by = auth.uid()
   WHERE id = _request_id
     AND match_status <> 'unmatched';

  RETURN _counterpart;
END;
$$;

REVOKE ALL ON FUNCTION public.end_care_match(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.end_care_match(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_care_match(uuid) TO service_role;