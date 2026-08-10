-- RM26 P2-T03: owner-only aggregate insights.
-- Reaction and wish-media tables are intentionally not readable by
-- authenticated clients. SECURITY DEFINER is therefore required here, but
-- access is guarded by auth.uid(), an explicit owner predicate, and a narrow
-- aggregate-only response. No raw wish, actor or storage fields are returned.

CREATE INDEX IF NOT EXISTS idx_wishes_event_created_at_rm26
  ON public.wishes(event_id, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wish_reactions_wish_created_at_rm26
  ON public.wish_reactions(wish_id, created_at);

CREATE INDEX IF NOT EXISTS idx_wish_media_wish_created_at_rm26
  ON public.wish_media(wish_id, created_at)
  WHERE processing_status = 'ready';

CREATE OR REPLACE FUNCTION public.get_event_insights(
  p_event_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz,
  p_timezone text,
  p_bucket text DEFAULT 'day'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_first_local timestamp;
  v_last_local timestamp;
  v_summary jsonb;
  v_media jsonb;
  v_reactions jsonb;
  v_trend jsonb;
BEGIN
  IF (SELECT auth.uid()) IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM public.events AS e
      WHERE e.id = p_event_id
        AND e.owner_id = (SELECT auth.uid())
        AND e.deleted_at IS NULL
    )
  THEN
    RAISE EXCEPTION 'INSIGHTS_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF p_range_start IS NULL
    OR p_range_end IS NULL
    OR p_range_end <= p_range_start
    OR p_range_end > p_range_start + interval '366 days'
  THEN
    RAISE EXCEPTION 'INSIGHTS_RANGE_INVALID' USING ERRCODE = '22023';
  END IF;

  IF p_bucket IS DISTINCT FROM 'day'
    OR p_timezone IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_timezone_names
      WHERE name = p_timezone
    )
  THEN
    RAISE EXCEPTION 'INSIGHTS_BUCKET_OR_TIMEZONE_INVALID' USING ERRCODE = '22023';
  END IF;

  v_first_local := date_trunc('day', p_range_start AT TIME ZONE p_timezone);
  v_last_local := date_trunc(
    'day',
    (p_range_end - interval '1 microsecond') AT TIME ZONE p_timezone
  );

  SELECT jsonb_build_object(
    'total', count(*)::bigint,
    'pending', count(*) FILTER (WHERE w.moderation_status = 'pending')::bigint,
    'approved', count(*) FILTER (WHERE w.moderation_status = 'approved')::bigint,
    'rejected', count(*) FILTER (WHERE w.moderation_status = 'rejected')::bigint,
    'hidden', count(*) FILTER (WHERE w.moderation_status = 'hidden')::bigint
  )
  INTO v_summary
  FROM public.wishes AS w
  WHERE w.event_id = p_event_id
    AND w.deleted_at IS NULL
    AND w.created_at >= p_range_start
    AND w.created_at < p_range_end;

  -- Media mix counts ready media on non-deleted, non-hidden/non-rejected
  -- wishes. Paths, MIME details and storage URLs stay outside this contract.
  SELECT jsonb_build_object(
    'total', count(*)::bigint,
    'image', count(*) FILTER (WHERE m.media_type = 'image')::bigint,
    'audio', count(*) FILTER (WHERE m.media_type = 'audio')::bigint
  )
  INTO v_media
  FROM public.wish_media AS m
  JOIN public.wishes AS w ON w.id = m.wish_id
  WHERE w.event_id = p_event_id
    AND w.deleted_at IS NULL
    AND w.moderation_status IN ('pending', 'approved')
    AND m.processing_status = 'ready'
    AND m.created_at >= p_range_start
    AND m.created_at < p_range_end;

  WITH grouped AS (
    SELECT r.emoji, count(*)::bigint AS reaction_count
    FROM public.wish_reactions AS r
    JOIN public.wishes AS w ON w.id = r.wish_id
    WHERE w.event_id = p_event_id
      AND w.deleted_at IS NULL
      AND w.moderation_status = 'approved'
      AND r.created_at >= p_range_start
      AND r.created_at < p_range_end
    GROUP BY r.emoji
  )
  SELECT jsonb_build_object(
    'total', COALESCE((SELECT sum(g.reaction_count) FROM grouped AS g), 0)::bigint,
    'by_emoji', COALESCE(
      (SELECT jsonb_object_agg(g.emoji, g.reaction_count) FROM grouped AS g),
      '{}'::jsonb
    )
  )
  INTO v_reactions;

  WITH wish_daily AS (
    SELECT
      date_trunc('day', w.created_at AT TIME ZONE p_timezone) AS local_day,
      count(*)::bigint AS total,
      count(*) FILTER (WHERE w.moderation_status = 'pending')::bigint AS pending,
      count(*) FILTER (WHERE w.moderation_status = 'approved')::bigint AS approved,
      count(*) FILTER (WHERE w.moderation_status = 'rejected')::bigint AS rejected,
      count(*) FILTER (WHERE w.moderation_status = 'hidden')::bigint AS hidden
    FROM public.wishes AS w
    WHERE w.event_id = p_event_id
      AND w.deleted_at IS NULL
      AND w.created_at >= p_range_start
      AND w.created_at < p_range_end
    GROUP BY 1
  ),
  reaction_daily AS (
    SELECT
      date_trunc('day', r.created_at AT TIME ZONE p_timezone) AS local_day,
      count(*)::bigint AS reactions
    FROM public.wish_reactions AS r
    JOIN public.wishes AS w ON w.id = r.wish_id
    WHERE w.event_id = p_event_id
      AND w.deleted_at IS NULL
      AND w.moderation_status = 'approved'
      AND r.created_at >= p_range_start
      AND r.created_at < p_range_end
    GROUP BY 1
  ),
  buckets AS (
    SELECT generate_series(v_first_local, v_last_local, interval '1 day') AS local_day
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'bucket_start', b.local_day AT TIME ZONE p_timezone,
        'local_date', b.local_day::date,
        'total', COALESCE(w.total, 0)::bigint,
        'pending', COALESCE(w.pending, 0)::bigint,
        'approved', COALESCE(w.approved, 0)::bigint,
        'rejected', COALESCE(w.rejected, 0)::bigint,
        'hidden', COALESCE(w.hidden, 0)::bigint,
        'reactions', COALESCE(r.reactions, 0)::bigint
      )
      ORDER BY b.local_day
    ),
    '[]'::jsonb
  )
  INTO v_trend
  FROM buckets AS b
  LEFT JOIN wish_daily AS w ON w.local_day = b.local_day
  LEFT JOIN reaction_daily AS r ON r.local_day = b.local_day;

  RETURN jsonb_build_object(
    'schema_version', 1,
    'event_id', p_event_id,
    'range', jsonb_build_object(
      'from', p_range_start,
      'to', p_range_end,
      'timezone', p_timezone,
      'bucket', p_bucket
    ),
    'summary', v_summary,
    'media', v_media,
    'reactions', v_reactions,
    'trend', v_trend
  );
END;
$function$;

COMMENT ON FUNCTION public.get_event_insights(uuid, timestamptz, timestamptz, text, text)
  IS 'Owner-only aggregate insights. Summary includes non-deleted wishes; media excludes hidden/rejected; reactions require approved wishes; trend uses zero-filled local IANA days.';

REVOKE ALL ON FUNCTION public.get_event_insights(uuid, timestamptz, timestamptz, text, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_event_insights(uuid, timestamptz, timestamptz, text, text)
  TO authenticated;
