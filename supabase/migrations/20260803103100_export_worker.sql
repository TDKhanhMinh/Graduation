CREATE OR REPLACE FUNCTION claim_export_job(worker_name text)
RETURNS SETOF export_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    claimed_job_id uuid;
BEGIN
    UPDATE export_jobs
    SET 
        status = 'processing',
        claimed_by = worker_name,
        claimed_at = now()
    WHERE id = (
        SELECT id
        FROM export_jobs
        -- Claim queued jobs, or jobs stuck in processing for more than 10 minutes (timeout)
        WHERE status = 'queued'
           OR (status = 'processing' AND claimed_at < now() - interval '10 minutes')
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    RETURNING id INTO claimed_job_id;

    RETURN QUERY
    SELECT * FROM export_jobs WHERE id = claimed_job_id;
END;
$$;
