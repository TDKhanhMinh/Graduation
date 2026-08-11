-- RM26 P3-T01: service-role export artifact retention contract.
-- Storage objects are deleted through the Storage API by the worker; this migration
-- only lists safe candidates and finalizes metadata after Storage deletion succeeds.

CREATE OR REPLACE FUNCTION public.get_export_artifacts_to_cleanup(
  p_retention_hours integer DEFAULT 24,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  job_id uuid,
  artifact_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_retention_hours < 1 OR p_retention_hours > 8760 THEN
    RAISE EXCEPTION 'EXPORT_RETENTION_HOURS_OUT_OF_RANGE' USING ERRCODE = '22023';
  END IF;
  IF p_limit < 1 OR p_limit > 1000 THEN
    RAISE EXCEPTION 'EXPORT_CLEANUP_LIMIT_OUT_OF_RANGE' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT job.id, job.artifact_path
  FROM public.export_jobs AS job
  WHERE job.state IN ('completed', 'failed', 'cancelled')
    AND job.artifact_path IS NOT NULL
    AND job.updated_at <= now() - pg_catalog.make_interval(hours => p_retention_hours)
  ORDER BY job.updated_at ASC
  LIMIT p_limit
  FOR UPDATE SKIP LOCKED;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_export_artifacts_to_cleanup(integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_export_artifacts_to_cleanup(integer, integer)
  TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_export_artifact_cleanup(
  p_job_id uuid,
  p_artifact_path text,
  p_retention_hours integer DEFAULT 24
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  IF p_retention_hours < 1 OR p_retention_hours > 8760 THEN
    RAISE EXCEPTION 'EXPORT_RETENTION_HOURS_OUT_OF_RANGE' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.export_jobs AS job
  WHERE job.id = p_job_id
    AND job.artifact_path = p_artifact_path
    AND job.state IN ('completed', 'failed', 'cancelled')
    AND job.updated_at <= now() - pg_catalog.make_interval(hours => p_retention_hours);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_export_artifact_cleanup(uuid, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_export_artifact_cleanup(uuid, text, integer)
  TO service_role;

COMMENT ON FUNCTION public.get_export_artifacts_to_cleanup(integer, integer) IS
  'Returns terminal export artifacts eligible for service-role Storage API deletion.';
COMMENT ON FUNCTION public.finalize_export_artifact_cleanup(uuid, text, integer) IS
  'Deletes terminal export metadata only after the private Storage object was removed.';
