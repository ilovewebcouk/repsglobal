-- 1. Rewrite the validation trigger with the new union allow-list.
CREATE OR REPLACE FUNCTION public.validate_professional_professions()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  allowed_prof TEXT[] := ARRAY[
    'personal-trainer','fitness-instructor','group-fitness-instructor',
    'strength-coach','nutritionist','pilates-instructor','yoga-teacher'
  ];
  allowed_spec TEXT[] := ARRAY[
    'fat-loss','muscle-gain','strength-training','functional-fitness',
    'hybrid-training','endurance-running','triathlon-prep','hyrox-prep',
    'marathon-prep','body-recomposition','pre-post-natal','menopause',
    'over-50s','youth-training','rehab-return-to-training','mobility',
    'posture-back-pain','weight-management','habit-lifestyle',
    'home-gym-coaching','corporate-wellness','online-coaching',
    'indoor-cycling-spin','bodypump-barbell','hiit','bootcamp','circuits',
    'les-mills-bodycombat','les-mills-bodyattack','les-mills-bodybalance',
    'les-mills-grit','step','aqua-aerobics','dance-fitness-zumba',
    'kettlebells-class','barre','senior-fitness-class','chair-based-class',
    'box-fit','metcon-class','mobility-class','pre-post-natal-class',
    'powerlifting','olympic-weightlifting','hypertrophy','athletic-performance',
    'speed-power','return-to-sport','youth-athlete-development',
    'tactical-first-responder','combat-sports-sc','endurance-athlete-sc',
    'team-sport-sc','field-sport-sc','court-sport-sc','rugby-sc','football-sc',
    'running-sc','cycling-sc','masters-athlete','pre-post-natal-strength',
    'competition-prep',
    'mat-pilates','reformer-pilates','clinical-rehab-pilates',
    'pre-post-natal-pilates','over-50s-pilates','back-care',
    'contemporary-pilates','classical-pilates','pilates-for-runners',
    'pilates-for-athletes','chair-pilates','cadillac-tower','barre-pilates',
    'mens-pilates','youth-pilates','pelvic-floor-pilates',
    'vinyasa-flow','hatha','yin','ashtanga','iyengar','kundalini',
    'restorative','pregnancy-yoga','postnatal-yoga','yoga-for-back-pain',
    'meditation-breathwork','power-yoga','rocket-yoga','hot-yoga','chair-yoga',
    'yoga-for-athletes','yoga-for-runners','kids-yoga','mens-yoga',
    'trauma-informed-yoga','yoga-nidra','sound-healing',
    'sports-nutrition','endurance-nutrition','physique-nutrition','gut-health',
    'plant-based','female-hormones','menopause-nutrition',
    'pre-post-natal-nutrition','clinical-conditions','diabetes-prediabetes',
    'cardiovascular-nutrition','habit-behaviour-change','intuitive-eating',
    'disordered-eating-recovery','child-family-nutrition',
    'youth-athlete-nutrition','vegan-vegetarian','corporate-nutrition',
    'online-nutrition-coaching',
    'gym-floor-instruction','inductions-programme-cards','older-adults',
    'youth-gym','functional-zone','accessible-inclusive-fitness',
    'gp-referral','cardio-machines-coaching','resistance-machines-coaching',
    'free-weights-intro','studio-cycling-intro','corporate-gym-floor'
  ];
  s TEXT;
BEGIN
  IF NEW.primary_profession IS NOT NULL AND NOT (NEW.primary_profession = ANY(allowed_prof)) THEN
    RAISE EXCEPTION 'invalid primary_profession: %', NEW.primary_profession;
  END IF;

  IF NEW.specialisms IS NULL THEN
    NEW.specialisms := '{}';
  END IF;

  IF array_length(NEW.specialisms, 1) > 3 THEN
    RAISE EXCEPTION 'specialisms: max 3';
  END IF;

  FOREACH s IN ARRAY COALESCE(NEW.specialisms, ARRAY[]::TEXT[]) LOOP
    IF NOT (s = ANY(allowed_spec)) THEN
      RAISE EXCEPTION 'invalid specialism: %', s;
    END IF;
  END LOOP;

  IF (SELECT COUNT(DISTINCT x) FROM unnest(NEW.specialisms) AS x)
       <> COALESCE(array_length(NEW.specialisms, 1), 0) THEN
    RAISE EXCEPTION 'specialisms must be unique';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Auto-map existing pros' specialisms via a (old_slug, profession) → new_slug table.
WITH map(old_slug, profession, new_slug) AS (
  VALUES
    ('fat-loss','personal-trainer','fat-loss'),
    ('fat-loss','nutritionist','weight-management'),
    ('muscle-gain','personal-trainer','muscle-gain'),
    ('muscle-gain','strength-coach','hypertrophy'),
    ('strength','personal-trainer','strength-training'),
    ('strength','strength-coach','powerlifting'),
    ('hybrid-functional','personal-trainer','hybrid-training'),
    ('hybrid-functional','group-fitness-instructor','circuits'),
    ('hybrid-functional','fitness-instructor','functional-zone'),
    ('endurance-running','personal-trainer','endurance-running'),
    ('endurance-running','strength-coach','endurance-athlete-sc'),
    ('endurance-running','pilates-instructor','pilates-for-runners'),
    ('endurance-running','yoga-teacher','yoga-for-runners'),
    ('endurance-running','nutritionist','endurance-nutrition'),
    ('sports-performance','strength-coach','athletic-performance'),
    ('sports-performance','pilates-instructor','pilates-for-athletes'),
    ('sports-performance','yoga-teacher','yoga-for-athletes'),
    ('sports-performance','nutritionist','sports-nutrition'),
    ('pre-post-natal','personal-trainer','pre-post-natal'),
    ('pre-post-natal','group-fitness-instructor','pre-post-natal-class'),
    ('pre-post-natal','strength-coach','pre-post-natal-strength'),
    ('pre-post-natal','pilates-instructor','pre-post-natal-pilates'),
    ('pre-post-natal','yoga-teacher','pregnancy-yoga'),
    ('pre-post-natal','nutritionist','pre-post-natal-nutrition'),
    ('over-50s','personal-trainer','over-50s'),
    ('over-50s','group-fitness-instructor','senior-fitness-class'),
    ('over-50s','strength-coach','masters-athlete'),
    ('over-50s','pilates-instructor','over-50s-pilates'),
    ('over-50s','yoga-teacher','chair-yoga'),
    ('over-50s','fitness-instructor','older-adults'),
    ('youth','personal-trainer','youth-training'),
    ('youth','strength-coach','youth-athlete-development'),
    ('youth','pilates-instructor','youth-pilates'),
    ('youth','yoga-teacher','kids-yoga'),
    ('youth','nutritionist','child-family-nutrition'),
    ('youth','fitness-instructor','youth-gym'),
    ('rehab-injury','personal-trainer','rehab-return-to-training'),
    ('rehab-injury','strength-coach','return-to-sport'),
    ('rehab-injury','pilates-instructor','clinical-rehab-pilates'),
    ('rehab-injury','yoga-teacher','yoga-for-back-pain'),
    ('rehab-injury','fitness-instructor','gp-referral'),
    ('mobility','personal-trainer','mobility'),
    ('mobility','group-fitness-instructor','mobility-class'),
    ('mobility','pilates-instructor','mat-pilates'),
    ('mobility','yoga-teacher','yin'),
    ('posture-back-pain','personal-trainer','posture-back-pain'),
    ('posture-back-pain','pilates-instructor','back-care'),
    ('posture-back-pain','yoga-teacher','yoga-for-back-pain'),
    ('weight-management','personal-trainer','weight-management'),
    ('weight-management','nutritionist','weight-management'),
    ('habit-lifestyle','personal-trainer','habit-lifestyle'),
    ('habit-lifestyle','nutritionist','habit-behaviour-change'),
    ('nutrition-coaching','nutritionist','online-nutrition-coaching'),
    ('online-coaching','personal-trainer','online-coaching'),
    ('online-coaching','nutritionist','online-nutrition-coaching')
), expanded AS (
  SELECT
    p.id,
    m.new_slug,
    array_position(p.specialisms, u.old_slug) AS pos
  FROM public.professionals p
  CROSS JOIN LATERAL unnest(p.specialisms) AS u(old_slug)
  JOIN map m
    ON m.old_slug = u.old_slug
   AND m.profession = p.primary_profession
  WHERE p.primary_profession IS NOT NULL
    AND p.specialisms IS NOT NULL
    AND array_length(p.specialisms, 1) > 0
), deduped AS (
  SELECT DISTINCT ON (id, new_slug) id, new_slug, pos
  FROM expanded
  ORDER BY id, new_slug, pos
), ordered AS (
  SELECT id, new_slug, row_number() OVER (PARTITION BY id ORDER BY pos) AS rn
  FROM deduped
), capped AS (
  SELECT id, array_agg(new_slug ORDER BY rn) AS new_specs
  FROM ordered
  WHERE rn <= 3
  GROUP BY id
)
UPDATE public.professionals p
SET specialisms = COALESCE(c.new_specs, '{}'::text[])
FROM (
  SELECT p2.id, c.new_specs
  FROM public.professionals p2
  LEFT JOIN capped c ON c.id = p2.id
) c
WHERE p.id = c.id
  AND p.specialisms IS DISTINCT FROM COALESCE(c.new_specs, '{}'::text[]);