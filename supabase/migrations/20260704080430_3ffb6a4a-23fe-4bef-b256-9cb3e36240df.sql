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
    'fat-loss','muscle-gain','strength-training','functional-fitness','hybrid-training','general-fitness','body-recomposition','fat-loss-transformation','powerbuilding','calisthenics','bodyweight-training','kettlebell-training','crossfit-style-pt','glute-training','arm-specialisation','core-abs-pt','deadlift-focus','squat-focus','bench-focus','olympic-lift-intro','plyometrics','agility-speed-pt','endurance-running','triathlon-prep','hyrox-prep','hyrox-doubles','marathon-prep','obstacle-race-prep','murph-prep','golf-fitness','tennis-fitness','pre-post-natal','menopause','over-50s','youth-training','rehab-return-to-training','chronic-pain','arthritis','cancer-recovery','cardiac-rehab','diabetes-training','hypertension-training','adaptive-inclusive-pt','mobility','posture-back-pain','weight-management','habit-lifestyle','home-gym-coaching','home-visit-pt','park-outdoor-pt','hotel-gym-pt','semi-private-pt','small-group-pt','couples-training','corporate-wellness','online-coaching','hybrid-online-in-person',
    'indoor-cycling-spin','les-mills-rpm','les-mills-sprint','bodypump-barbell','les-mills-tone','les-mills-cxworx','les-mills-bodycombat','les-mills-bodyattack','les-mills-bodybalance','les-mills-bodyjam','les-mills-shbam','les-mills-grit','hiit','tabata-class','insanity','bootcamp','outdoor-bootcamp','circuits','metcon-class','functional-training-class','kettlebell-flow-class','kettlebells-class','sports-conditioning-class','primal-movement','step','aqua-aerobics','aqua-hiit','aqua-strength','dance-fitness-zumba','dance-cardio','hip-hop-dance','ballet-fit','barre','box-fit','boxing-fitness','kickboxing-class','mma-fitness','senior-fitness-class','chair-based-class','silversneakers-style','teen-fitness-class','family-fitness','disability-inclusive-class','mobility-class','stretch-class','foam-roll-class','wellness-flow','pre-post-natal-class','express-30','lunchtime-express','virtual-class','live-stream-class',
    'powerlifting','olympic-weightlifting','hypertrophy','natural-bodybuilding','physique-competition','bodybuilding-classic','strongman','strongwoman','crossfit-competitive','hyrox-athlete-sc','athletic-performance','speed-power','jump-training','sprint-mechanics','change-of-direction','agility-sc','plyometric-programming','block-periodisation','conjugate-method','5-3-1-programming','linear-progression','gpp-sc','return-to-sport','youth-athlete-development','masters-athlete','tactical-first-responder','military-prep','police-fire-prep','combat-sports-sc','mixed-martial-arts-sc','boxing-sc','wrestling-sc','jiu-jitsu-sc','judo-sc','endurance-athlete-sc','running-sc','cycling-sc','swimming-sc','rowing-sc','triathlon-sc','team-sport-sc','field-sport-sc','court-sport-sc','rugby-sc','football-sc','hockey-sc','cricket-sc','basketball-sc','netball-sc','tennis-sc','golf-sc','motorsport-sc','esports-performance','pre-post-natal-strength','competition-prep','remote-programming-sc',
    'mat-pilates','reformer-pilates','cadillac-tower','tower-mat','wunda-chair','spine-corrector','jumpboard','magic-circle','small-equipment-pilates','foam-roller-pilates','therapy-ball-pilates','barre-pilates','chair-pilates','standing-pilates','classical-pilates','contemporary-pilates','contrology-classical','stott-based','polestar-based','clinical-rehab-pilates','pre-post-surgery-pilates','pilates-for-scoliosis','pilates-for-hypermobility','pilates-for-osteoporosis','pilates-for-arthritis','back-care','pelvic-floor-pilates','pre-post-natal-pilates','prenatal-reformer','postnatal-reformer','over-50s-pilates','mens-pilates','youth-pilates','athletic-pilates','pilates-for-runners','pilates-for-cyclists','pilates-for-swimmers','pilates-for-golfers','pilates-for-tennis','pilates-for-dancers','pilates-for-athletes','pilates-strength','pilates-cardio','hiit-pilates',
    'vinyasa-flow','slow-flow','dynamic-flow','mandala-flow','hatha','yin','yin-yang','restorative','restorative-yin','gentle-yoga','ashtanga','iyengar','kundalini','jivamukti','sivananda','anusara','bikram','hot-yoga','power-yoga','rocket-yoga','forrest-yoga','dharma-yoga','aerial-yoga','acro-yoga','sup-yoga','chair-yoga','chair-yoga-seniors','kids-yoga','mens-yoga','pregnancy-yoga','postnatal-yoga','yoga-for-fertility','yoga-for-menopause','yoga-for-hormones','yoga-for-back-pain','yoga-for-athletes','yoga-for-runners','yoga-for-anxiety','yoga-for-depression','yoga-for-sleep','trauma-informed-yoga','yoga-therapy','meditation-breathwork','pranayama','yoga-nidra','yoga-nidra-deep-rest','sound-healing','mantra-chanting','philosophy-yoga','ayurveda-yoga','corporate-yoga','office-desk-yoga','yoga-teacher-training-mentor',
    'muscle-gain-nutrition','cutting-nutrition','contest-prep-nutrition','sports-nutrition','endurance-nutrition','physique-nutrition','gut-health','ibs-nutrition','ibd-nutrition','low-fodmap','coeliac-gluten-free','dairy-free','food-allergies','food-intolerances','plant-based','vegan-vegetarian','mediterranean-diet','keto-lchf','carnivore','paleo','whole-food','anti-inflammatory','autoimmune-protocol','ramadan-nutrition','halal-nutrition','kosher-nutrition','female-hormones','menopause-nutrition','pcos-nutrition','endometriosis-nutrition','thyroid-nutrition','fertility-nutrition','pregnancy-nutrition','breastfeeding-nutrition','pre-post-natal-nutrition','weaning-nutrition','toddler-nutrition','child-family-nutrition','teen-nutrition','youth-athlete-nutrition','senior-nutrition','clinical-conditions','diabetes-prediabetes','cardiovascular-nutrition','cognitive-brain-health','longevity-nutrition','immune-nutrition','skin-nutrition','hair-nail-nutrition','habit-behaviour-change','intuitive-eating','mindful-eating','disordered-eating-recovery','mental-health-nutrition','alcohol-recovery','addiction-recovery-nutrition','corporate-nutrition','online-nutrition-coaching',
    'gym-floor-instruction','inductions-programme-cards','new-member-onboarding','member-retention-floor','class-cover','functional-zone','functional-rig-coaching','sled-track-coaching','cardio-machines-coaching','resistance-machines-coaching','cable-machines-coaching','plate-loaded-coaching','smith-machine-coaching','hack-squat-coaching','leg-press-coaching','assisted-machines','free-weights-intro','studio-cycling-intro','stretch-corner','foam-roll-corner','older-adults','seniors-morning-club','youth-gym','teens-after-school','kids-club-fitness','family-fitness-floor','women-only-hours','mens-hours','accessible-inclusive-fitness','adaptive-gym-floor','wheelchair-accessible-floor','blind-partially-sighted-fitness','deaf-fitness','learning-disability-fitness','gp-referral','health-checks','bp-checks','body-comp-scans','inbody-scans','dexa-scans','cardio-testing','vo2-testing','hydrotherapy-pool','sauna-steam-guidance','hotel-gym-instruction','university-gym','community-gym','corporate-gym-floor','night-shift-cover','weekend-cover'
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