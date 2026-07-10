ALTER TABLE public.reps_courses
  DROP COLUMN IF EXISTS decision_snapshot,
  DROP COLUMN IF EXISTS report_pdf_path,
  DROP COLUMN IF EXISTS report_generated_at;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (COALESCE(qual,'') LIKE '%course-reports%' OR COALESCE(with_check,'') LIKE '%course-reports%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;