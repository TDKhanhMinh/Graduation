-- RM26 P3-T01: additive, owner-scoped export job and private delivery boundary.
-- The browser never receives a service-role credential or a plaintext print token.

CREATE TABLE public.export_jobs (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 128),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  snapshot_hash text NOT NULL CHECK (snapshot_hash ~ '^[a-f0-9]{64}$'),
  state text NOT NULL DEFAULT 'queued'
    CHECK (state IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  lease_owner text,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  print_token_hash text NOT NULL CHECK (print_token_hash ~ '^[a-f0-9]{64}$'),
  print_token_expires_at timestamptz NOT NULL,
  print_token_consumed_at timestamptz,
  artifact_path text,
  artifact_size_bytes bigint CHECK (artifact_size_bytes IS NULL OR artifact_size_bytes > 0),
  artifact_sha256 text CHECK (artifact_sha256 IS NULL OR artifact_sha256 ~ '^[a-f0-9]{64}$'),
  last_error_code text,
  last_error_message text CHECK (last_error_message IS NULL OR char_length(last_error_message) <= 500),
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, owner_id, idempotency_key),
  CHECK (
    (state = 'completed' AND artifact_path IS NOT NULL AND artifact_size_bytes IS NOT NULL AND artifact_sha256 IS NOT NULL)
    OR state <> 'completed'
  ),
  CHECK (state <> 'cancelled' OR cancelled_at IS NOT NULL)
);

CREATE INDEX export_jobs_queue_idx
  ON public.export_jobs (state, next_attempt_at, created_at)
  WHERE state IN ('queued', 'processing');

CREATE INDEX export_jobs_owner_idx
  ON public.export_jobs (owner_id, created_at DESC);

CREATE INDEX export_jobs_expiry_idx
  ON public.export_jobs (updated_at)
  WHERE state IN ('completed', 'failed', 'cancelled');

CREATE OR REPLACE FUNCTION private.prevent_export_job_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.event_id IS DISTINCT FROM OLD.event_id
     OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
     OR NEW.snapshot IS DISTINCT FROM OLD.snapshot
     OR NEW.snapshot_hash IS DISTINCT FROM OLD.snapshot_hash
  THEN
    RAISE EXCEPTION 'EXPORT_JOB_IMMUTABLE_FIELDS' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.prevent_export_job_immutable_fields() FROM PUBLIC;

CREATE TRIGGER trg_export_jobs_immutable_fields
BEFORE UPDATE ON public.export_jobs
FOR EACH ROW
EXECUTE FUNCTION private.prevent_export_job_immutable_fields();

CREATE TRIGGER trg_export_jobs_updated_at
BEFORE UPDATE ON public.export_jobs
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.export_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.export_jobs TO authenticated;
GRANT ALL ON public.export_jobs TO service_role;

CREATE POLICY export_jobs_owner_read
ON public.export_jobs
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = owner_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'yearbook-exports',
  'yearbook-exports',
  false,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY export_jobs_owner_download
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'yearbook-exports'
  AND EXISTS (
    SELECT 1
    FROM public.export_jobs AS job
    WHERE job.owner_id = (SELECT auth.uid())
      AND job.state = 'completed'
      AND job.artifact_path = storage.objects.name
      AND split_part(storage.objects.name, '/', 1) = job.owner_id::text
  )
);

-- Server-only creation. The API verifies the session and supplies the snapshot
-- produced by the owner-scoped P2-T01 projection; clients cannot call this RPC.
CREATE OR REPLACE FUNCTION public.create_export_job(
  p_job_id uuid,
  p_event_id uuid,
  p_owner_id uuid,
  p_idempotency_key text,
  p_snapshot jsonb,
  p_snapshot_hash text,
  p_print_token_hash text,
  p_print_token_expires_at timestamptz
)
RETURNS TABLE (id uuid, state text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_job_id IS NULL OR p_event_id IS NULL OR p_owner_id IS NULL THEN
    RAISE EXCEPTION 'EXPORT_JOB_INPUT_INVALID' USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 1 AND 128 THEN
    RAISE EXCEPTION 'EXPORT_JOB_INPUT_INVALID' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.events AS event_row
    WHERE event_row.id = p_event_id
      AND event_row.owner_id = p_owner_id
      AND event_row.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'EXPORT_JOB_NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  IF (p_snapshot->'event'->>'id') IS DISTINCT FROM p_event_id::text
     OR p_snapshot_hash !~ '^[a-f0-9]{64}$'
     OR p_print_token_hash !~ '^[a-f0-9]{64}$'
     OR p_print_token_expires_at <= now()
  THEN
    RAISE EXCEPTION 'EXPORT_JOB_INPUT_INVALID' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.export_jobs (
    id,
    event_id,
    owner_id,
    idempotency_key,
    snapshot,
    snapshot_hash,
    print_token_hash,
    print_token_expires_at
  )
  VALUES (
    p_job_id,
    p_event_id,
    p_owner_id,
    p_idempotency_key,
    p_snapshot,
    p_snapshot_hash,
    p_print_token_hash,
    p_print_token_expires_at
  )
  ON CONFLICT (event_id, owner_id, idempotency_key) DO NOTHING;

  RETURN QUERY
  SELECT job.id, job.state, job.created_at
  FROM public.export_jobs AS job
  WHERE job.event_id = p_event_id
    AND job.owner_id = p_owner_id
    AND job.idempotency_key = p_idempotency_key;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_export_job(uuid, uuid, uuid, text, jsonb, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_export_job(uuid, uuid, uuid, text, jsonb, text, text, timestamptz)
  TO service_role;

-- The worker claims one job while holding only the row-level update lock. The
-- lock is released before rendering or uploading begins.
CREATE OR REPLACE FUNCTION public.claim_export_job(
  p_worker_id text,
  p_lease_seconds integer DEFAULT 120
)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  owner_id uuid,
  snapshot jsonb,
  attempt_count integer,
  max_attempts integer,
  lease_expires_at timestamptz,
  print_token_expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  claimed_id uuid;
BEGIN
  IF p_worker_id IS NULL OR char_length(p_worker_id) NOT BETWEEN 1 AND 128
     OR p_lease_seconds NOT BETWEEN 30 AND 900
  THEN
    RAISE EXCEPTION 'EXPORT_WORKER_INPUT_INVALID' USING ERRCODE = '22023';
  END IF;

  UPDATE public.export_jobs AS job
  SET state = 'failed',
      lease_owner = NULL,
      lease_expires_at = NULL,
      last_error_code = 'EXPORT_MAX_ATTEMPTS',
      last_error_message = 'Lease expired after the maximum retry count'
  WHERE job.state = 'processing'
    AND job.lease_expires_at IS NOT NULL
    AND job.lease_expires_at <= now()
    AND job.attempt_count >= job.max_attempts;

  SELECT job.id
  INTO claimed_id
  FROM public.export_jobs AS job
  WHERE (
      (job.state = 'queued' AND job.next_attempt_at <= now())
      OR (job.state = 'processing' AND job.lease_expires_at IS NOT NULL AND job.lease_expires_at <= now())
    )
    AND job.attempt_count < job.max_attempts
  ORDER BY job.created_at ASC, job.id ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF claimed_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.export_jobs AS job
  SET state = 'processing',
      attempt_count = job.attempt_count + 1,
      lease_owner = p_worker_id,
      lease_expires_at = now() + (p_lease_seconds * interval '1 second'),
      next_attempt_at = now(),
      print_token_consumed_at = NULL,
      started_at = COALESCE(job.started_at, now()),
      last_error_code = NULL,
      last_error_message = NULL
  WHERE job.id = claimed_id;

  RETURN QUERY
  SELECT job.id,
         job.event_id,
         job.owner_id,
         job.snapshot,
         job.attempt_count,
         job.max_attempts,
         job.lease_expires_at,
         job.print_token_expires_at,
         job.created_at
  FROM public.export_jobs AS job
  WHERE job.id = claimed_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_export_job(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_export_job(text, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.heartbeat_export_job(
  p_job_id uuid,
  p_worker_id text,
  p_lease_seconds integer DEFAULT 120
)
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  UPDATE public.export_jobs AS job
  SET lease_expires_at = now() + (p_lease_seconds * interval '1 second')
  WHERE job.id = p_job_id
    AND job.state = 'processing'
    AND job.lease_owner = p_worker_id
    AND p_lease_seconds BETWEEN 30 AND 900
  RETURNING job.lease_expires_at;
$function$;

REVOKE ALL ON FUNCTION public.heartbeat_export_job(uuid, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.heartbeat_export_job(uuid, text, integer)
  TO service_role;

CREATE OR REPLACE FUNCTION public.prepare_export_print_token(
  p_job_id uuid,
  p_worker_id text,
  p_print_token_hash text,
  p_print_token_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_print_token_hash !~ '^[a-f0-9]{64}$'
     OR p_print_token_expires_at <= now()
  THEN
    RAISE EXCEPTION 'EXPORT_PRINT_TOKEN_INVALID' USING ERRCODE = '22023';
  END IF;

  UPDATE public.export_jobs AS job
  SET print_token_hash = p_print_token_hash,
      print_token_expires_at = p_print_token_expires_at,
      print_token_consumed_at = NULL
  WHERE job.id = p_job_id
    AND job.state = 'processing'
    AND job.lease_owner = p_worker_id
    AND job.lease_expires_at > now();

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.prepare_export_print_token(uuid, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_export_print_token(uuid, text, text, timestamptz)
  TO service_role;

-- The protected print route calls this with a hash derived from the token. The
-- compare-and-mark is atomic, so a replay cannot consume the same token twice.
CREATE OR REPLACE FUNCTION public.consume_export_print_token(
  p_job_id uuid,
  p_print_token_hash text
)
RETURNS TABLE (job_id uuid, event_id uuid, owner_id uuid, snapshot jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  UPDATE public.export_jobs AS job
  SET print_token_consumed_at = now()
  WHERE job.id = p_job_id
    AND job.state = 'processing'
    AND job.print_token_hash = p_print_token_hash
    AND job.print_token_consumed_at IS NULL
    AND job.print_token_expires_at > now()
    AND job.lease_expires_at > now()
  RETURNING job.id, job.event_id, job.owner_id, job.snapshot;
$function$;

REVOKE ALL ON FUNCTION public.consume_export_print_token(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_export_print_token(uuid, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.complete_export_job(
  p_job_id uuid,
  p_worker_id text,
  p_artifact_path text,
  p_artifact_size_bytes bigint,
  p_artifact_sha256 text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  job_owner_id uuid;
BEGIN
  IF p_artifact_size_bytes <= 0
     OR p_artifact_size_bytes > 52428800
     OR p_artifact_sha256 !~ '^[a-f0-9]{64}$'
  THEN
    RAISE EXCEPTION 'EXPORT_ARTIFACT_METADATA_INVALID' USING ERRCODE = '22023';
  END IF;

  SELECT job.owner_id
  INTO job_owner_id
  FROM public.export_jobs AS job
  WHERE job.id = p_job_id;

  IF job_owner_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_artifact_path !~ ('^' || job_owner_id::text || '/' || p_job_id::text || '/[^/]+\\.pdf$') THEN
    RAISE EXCEPTION 'EXPORT_ARTIFACT_PATH_INVALID' USING ERRCODE = '22023';
  END IF;

  UPDATE public.export_jobs AS job
  SET state = 'completed',
      lease_owner = NULL,
      lease_expires_at = NULL,
      artifact_path = p_artifact_path,
      artifact_size_bytes = p_artifact_size_bytes,
      artifact_sha256 = p_artifact_sha256,
      completed_at = COALESCE(job.completed_at, now()),
      last_error_code = NULL,
      last_error_message = NULL
  WHERE job.id = p_job_id
    AND job.state = 'processing'
    AND job.lease_owner = p_worker_id
    AND job.lease_expires_at > now();

  IF FOUND THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.export_jobs AS job
    WHERE job.id = p_job_id
      AND job.state = 'completed'
      AND job.artifact_path = p_artifact_path
      AND job.artifact_sha256 = p_artifact_sha256
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_export_job(uuid, text, text, bigint, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_export_job(uuid, text, text, bigint, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.fail_export_job(
  p_job_id uuid,
  p_worker_id text,
  p_error_code text,
  p_error_message text,
  p_retry_after_seconds integer DEFAULT 60
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  next_state text;
BEGIN
  UPDATE public.export_jobs AS job
  SET state = CASE WHEN job.attempt_count >= job.max_attempts THEN 'failed' ELSE 'queued' END,
      lease_owner = NULL,
      lease_expires_at = NULL,
      next_attempt_at = CASE
        WHEN job.attempt_count >= job.max_attempts THEN now()
        ELSE now() + (GREATEST(1, LEAST(COALESCE(p_retry_after_seconds, 60), 3600)) * interval '1 second')
      END,
      last_error_code = LEFT(COALESCE(p_error_code, 'EXPORT_WORKER_ERROR'), 100),
      last_error_message = LEFT(COALESCE(p_error_message, 'Export worker failed'), 500)
  WHERE job.id = p_job_id
    AND job.state = 'processing'
    AND job.lease_owner = p_worker_id
    AND job.lease_expires_at > now()
  RETURNING job.state INTO next_state;

  RETURN next_state;
END;
$function$;

REVOKE ALL ON FUNCTION public.fail_export_job(uuid, text, text, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_export_job(uuid, text, text, text, integer)
  TO service_role;

CREATE OR REPLACE FUNCTION public.cancel_export_job(p_job_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  WITH cancelled AS (
    UPDATE public.export_jobs AS job
    SET state = 'cancelled',
        lease_owner = NULL,
        lease_expires_at = NULL,
        cancelled_at = now()
    WHERE job.id = p_job_id
      AND job.owner_id = (SELECT auth.uid())
      AND job.state IN ('queued', 'processing')
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM cancelled);
$function$;

REVOKE ALL ON FUNCTION public.cancel_export_job(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_export_job(uuid) TO authenticated;

COMMENT ON TABLE public.export_jobs IS
  'Owner-scoped immutable export snapshots with bounded worker leases and private artifacts.';
COMMENT ON COLUMN public.export_jobs.print_token_hash IS
  'SHA-256 hash of the current scoped, one-time print token; plaintext is never persisted.';
