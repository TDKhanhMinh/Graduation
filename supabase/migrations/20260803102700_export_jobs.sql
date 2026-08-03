-- Create export_jobs table
CREATE TABLE public.export_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    idempotency_key text,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    snapshot jsonb,
    token text NOT NULL,
    output_path text,
    retry_count integer NOT NULL DEFAULT 0,
    claimed_at timestamptz,
    claimed_by text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(event_id, idempotency_key)
);

-- Add index on status for faster queue polling
CREATE INDEX idx_export_jobs_status ON public.export_jobs(status);
CREATE INDEX idx_export_jobs_owner_id ON public.export_jobs(owner_id);

-- Enable RLS
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

-- Owner can read their own jobs
CREATE POLICY "Users can view their own export jobs" 
    ON public.export_jobs
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = owner_id);

-- Create bucket for exports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('yearbook-exports', 'yearbook-exports', false) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies
-- We enforce that the root folder is the owner's ID
CREATE POLICY "Users can download their own exports"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'yearbook-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Note: Insert and Update on export_jobs, as well as storage object uploads, 
-- will be done by a service_role (API / Worker) to ensure integrity, 
-- so no RLS INSERT/UPDATE policies for authenticated users are needed.
