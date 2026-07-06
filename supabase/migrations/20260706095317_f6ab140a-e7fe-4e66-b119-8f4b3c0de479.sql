UPDATE public.seo_index_events
SET acknowledged_at = now(),
    acknowledged_by = NULL
WHERE acknowledged_at IS NULL;