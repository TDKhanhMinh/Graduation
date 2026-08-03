-- Controlled owner moderation command with immutable, transactional audit.

REVOKE ALL ON public.moderation_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.moderation_audit_logs TO authenticated;

DROP POLICY IF EXISTS "owners can read event moderation audit"
  ON public.moderation_audit_logs;

CREATE POLICY "owners can read event moderation audit"
ON public.moderation_audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = moderation_audit_logs.event_id
      AND e.owner_id = (SELECT auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.moderate_wishes(
  p_wish_ids uuid[],
  p_action text,
  p_reason text DEFAULT NULL,
  p_expected_versions jsonb DEFAULT NULL
)
RETURNS TABLE (
  wish_id uuid,
  moderation_status text,
  is_pinned boolean,
  deleted_at timestamptz,
  updated_at timestamptz,
  audit_id bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid;
  v_action text;
  v_reason text;
  v_requested_count integer;
  v_owned_count integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_wish public.wishes%ROWTYPE;
  v_after public.wishes%ROWTYPE;
  v_old_value jsonb;
  v_new_value jsonb;
  v_audit_id bigint;
  v_expected_text text;
  v_expected_at timestamptz;
BEGIN
  v_actor_id := (SELECT auth.uid());
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'MODERATION_NOT_ALLOWED';
  END IF;

  v_action := pg_catalog.lower(pg_catalog.btrim(p_action));
  v_reason := NULLIF(pg_catalog.btrim(p_reason), '');
  v_requested_count := COALESCE(pg_catalog.cardinality(p_wish_ids), 0);

  IF v_requested_count < 1 OR v_requested_count > 100 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'INVALID_BATCH_SIZE';
  END IF;

  IF (
    SELECT pg_catalog.count(DISTINCT wish_id_value)
    FROM pg_catalog.unnest(p_wish_ids) AS wish_id_value
  ) <> v_requested_count THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'DUPLICATE_WISH_ID';
  END IF;

  IF v_action NOT IN (
    'approve',
    'reject',
    'hide',
    'pin',
    'unpin',
    'soft_delete',
    'restore'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'INVALID_MODERATION_ACTION';
  END IF;

  IF v_reason IS NOT NULL AND pg_catalog.char_length(v_reason) > 500 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'MODERATION_REASON_TOO_LONG';
  END IF;

  IF p_expected_versions IS NOT NULL
    AND pg_catalog.jsonb_typeof(p_expected_versions) <> 'object'
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'INVALID_EXPECTED_VERSIONS';
  END IF;

  -- Lock every owned target before validating any transition. If one target is
  -- missing or belongs to another owner, no mutation or audit row is written.
  PERFORM 1
  FROM public.wishes w
  JOIN public.events e ON e.id = w.event_id
  WHERE w.id = ANY(p_wish_ids)
    AND e.owner_id = v_actor_id
  ORDER BY w.id
  FOR UPDATE OF w;

  SELECT pg_catalog.count(*)::integer
  INTO v_owned_count
  FROM public.wishes w
  JOIN public.events e ON e.id = w.event_id
  WHERE w.id = ANY(p_wish_ids)
    AND e.owner_id = v_actor_id;

  IF v_owned_count <> v_requested_count THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'MODERATION_NOT_ALLOWED';
  END IF;

  -- Validate all versions and transitions before updating the first row.
  FOR v_wish IN
    SELECT w.*
    FROM public.wishes w
    WHERE w.id = ANY(p_wish_ids)
    ORDER BY w.id
  LOOP
    IF p_expected_versions IS NOT NULL THEN
      v_expected_text := p_expected_versions ->> v_wish.id::text;
      IF v_expected_text IS NULL THEN
        RAISE EXCEPTION USING
          ERRCODE = '40001',
          MESSAGE = 'STALE_WISH_VERSION';
      END IF;

      BEGIN
        v_expected_at := v_expected_text::timestamptz;
      EXCEPTION WHEN invalid_datetime_format THEN
        RAISE EXCEPTION USING
          ERRCODE = '22023',
          MESSAGE = 'INVALID_EXPECTED_VERSION';
      END;

      IF v_expected_at IS DISTINCT FROM v_wish.updated_at THEN
        RAISE EXCEPTION USING
          ERRCODE = '40001',
          MESSAGE = 'STALE_WISH_VERSION';
      END IF;
    END IF;

    IF v_action = 'approve' AND (
      v_wish.deleted_at IS NOT NULL
      OR v_wish.moderation_status = 'approved'
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'INVALID_TRANSITION:approve';
    ELSIF v_action = 'reject' AND (
      v_wish.deleted_at IS NOT NULL
      OR v_wish.moderation_status = 'rejected'
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'INVALID_TRANSITION:reject';
    ELSIF v_action = 'hide' AND (
      v_wish.deleted_at IS NOT NULL
      OR v_wish.moderation_status <> 'approved'
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'INVALID_TRANSITION:hide';
    ELSIF v_action = 'pin' AND (
      v_wish.deleted_at IS NOT NULL
      OR v_wish.moderation_status <> 'approved'
      OR v_wish.is_pinned
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'PIN_REQUIRES_UNPINNED_APPROVED_WISH';
    ELSIF v_action = 'unpin' AND (
      v_wish.deleted_at IS NOT NULL
      OR v_wish.moderation_status <> 'approved'
      OR NOT v_wish.is_pinned
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'UNPIN_REQUIRES_PINNED_APPROVED_WISH';
    ELSIF v_action = 'soft_delete' AND v_wish.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'INVALID_TRANSITION:soft_delete';
    ELSIF v_action = 'restore' AND (
      v_wish.deleted_at IS NULL
      OR v_wish.deleted_at < v_now - pg_catalog.make_interval(mins => 5)
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'RESTORE_WINDOW_EXPIRED';
    END IF;
  END LOOP;

  FOR v_wish IN
    SELECT w.*
    FROM public.wishes w
    WHERE w.id = ANY(p_wish_ids)
    ORDER BY w.id
  LOOP
    v_old_value := pg_catalog.jsonb_build_object(
      'moderation_status', v_wish.moderation_status,
      'is_pinned', v_wish.is_pinned,
      'moderation_reason', v_wish.moderation_reason,
      'moderated_by', v_wish.moderated_by,
      'moderated_at', v_wish.moderated_at,
      'approved_at', v_wish.approved_at,
      'deleted_at', v_wish.deleted_at,
      'updated_at', v_wish.updated_at
    );

    IF v_action = 'approve' THEN
      UPDATE public.wishes
      SET moderation_status = 'approved',
          is_pinned = false,
          moderation_reason = NULL,
          moderated_by = v_actor_id,
          moderated_at = v_now,
          approved_at = v_now
      WHERE id = v_wish.id
      RETURNING * INTO v_after;
    ELSIF v_action = 'reject' THEN
      UPDATE public.wishes
      SET moderation_status = 'rejected',
          is_pinned = false,
          moderation_reason = v_reason,
          moderated_by = v_actor_id,
          moderated_at = v_now,
          approved_at = NULL
      WHERE id = v_wish.id
      RETURNING * INTO v_after;
    ELSIF v_action = 'hide' THEN
      UPDATE public.wishes
      SET moderation_status = 'hidden',
          is_pinned = false,
          moderation_reason = v_reason,
          moderated_by = v_actor_id,
          moderated_at = v_now
      WHERE id = v_wish.id
      RETURNING * INTO v_after;
    ELSIF v_action = 'pin' THEN
      UPDATE public.wishes
      SET is_pinned = true,
          moderated_by = v_actor_id,
          moderated_at = v_now
      WHERE id = v_wish.id
      RETURNING * INTO v_after;
    ELSIF v_action = 'unpin' THEN
      UPDATE public.wishes
      SET is_pinned = false,
          moderated_by = v_actor_id,
          moderated_at = v_now
      WHERE id = v_wish.id
      RETURNING * INTO v_after;
    ELSIF v_action = 'soft_delete' THEN
      UPDATE public.wishes
      SET is_pinned = false,
          moderated_by = v_actor_id,
          moderated_at = v_now,
          deleted_at = v_now
      WHERE id = v_wish.id
      RETURNING * INTO v_after;
    ELSE
      UPDATE public.wishes
      SET is_pinned = false,
          moderated_by = v_actor_id,
          moderated_at = v_now,
          deleted_at = NULL
      WHERE id = v_wish.id
      RETURNING * INTO v_after;
    END IF;

    v_new_value := pg_catalog.jsonb_build_object(
      'moderation_status', v_after.moderation_status,
      'is_pinned', v_after.is_pinned,
      'moderation_reason', v_after.moderation_reason,
      'moderated_by', v_after.moderated_by,
      'moderated_at', v_after.moderated_at,
      'approved_at', v_after.approved_at,
      'deleted_at', v_after.deleted_at,
      'updated_at', v_after.updated_at
    );

    INSERT INTO public.moderation_audit_logs (
      event_id,
      wish_id,
      actor_id,
      action,
      old_value,
      new_value,
      created_at
    )
    VALUES (
      v_after.event_id,
      v_after.id,
      v_actor_id,
      v_action,
      v_old_value,
      v_new_value,
      v_now
    )
    RETURNING id INTO v_audit_id;

    wish_id := v_after.id;
    moderation_status := v_after.moderation_status;
    is_pinned := v_after.is_pinned;
    deleted_at := v_after.deleted_at;
    updated_at := v_after.updated_at;
    audit_id := v_audit_id;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.moderate_wishes(
  uuid[],
  text,
  text,
  jsonb
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_wishes(
  uuid[],
  text,
  text,
  jsonb
) TO authenticated;

COMMENT ON FUNCTION public.moderate_wishes(uuid[], text, text, jsonb) IS
  'Owner-only atomic moderation command. Direct wish updates remain revoked.';
