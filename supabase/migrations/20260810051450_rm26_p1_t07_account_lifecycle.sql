-- RM26 P1-T07: account deletion request state, export boundary and retention
-- coordination. The table is service-role-only; no client can mutate lifecycle
-- state directly.

CREATE TABLE public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'cooling_off'
    CHECK (status IN ('cooling_off', 'cancelled', 'purged')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz NOT NULL,
  cancelled_at timestamptz,
  purged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_deletion_schedule_check
    CHECK (scheduled_for >= requested_at),
  CONSTRAINT account_deletion_status_timestamps_check
    CHECK (
      (status = 'cancelled' AND cancelled_at IS NOT NULL)
      OR (status <> 'cancelled' AND cancelled_at IS NULL)
    )
);

CREATE UNIQUE INDEX uq_account_deletion_active
  ON public.account_deletion_requests(user_id)
  WHERE user_id IS NOT NULL AND status = 'cooling_off';

CREATE INDEX idx_account_deletion_due
  ON public.account_deletion_requests(scheduled_for)
  WHERE status = 'cooling_off';

CREATE TRIGGER trg_account_deletion_updated_at
BEFORE UPDATE ON public.account_deletion_requests
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

COMMENT ON TABLE public.account_deletion_requests
  IS 'Service-only account deletion cooling-off state; purge workers own final transition.';
COMMENT ON COLUMN public.account_deletion_requests.scheduled_for
  IS 'Earliest purge time after the 30-day restore window defined by the ADR.';
COMMENT ON COLUMN public.account_deletion_requests.user_id
  IS 'Nullable by design so auth identity deletion does not erase lifecycle audit evidence.';

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_deletion_requests FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.account_deletion_requests TO service_role;
