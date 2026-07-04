/**
 * Canonical specialism catalogue — single source of truth.
 *
 * Specialisms are PROFESSION-SCOPED. Each profession unlocks a dedicated
 * list of specialisms; a slug listed under multiple professions is shared
 * intentionally (e.g. `weight-management` for PT + Nutritionist).
 *
 * Mirrors the validation trigger on public.professionals
 * (validate_professional_professions). Keep in sync.
 *
 * Pros may pick up to MAX_SPECIALISMS from their profession's list.
 */

import type { ProfessionSlug } from "@/lib/professions";

export type Specialism = {
  slug: string;
  label: string;
  professions: ProfessionSlug[];
};

export const MAX_SPECIALISMS = 3;

/* -------------------------------------------------------------------------- */
/* Per-profession catalogues                                                  */
/* -------------------------------------------------------------------------- */

const PERSONAL_TRAINER: Specialism[] = [
  { slug: "fat-loss", label: "Fat Loss", professions: ["personal-trainer"] },
  { slug: "muscle-gain", label: "Muscle Gain", professions: ["personal-trainer"] },
  { slug: "strength-training", label: "Strength Training", professions: ["personal-trainer"] },
  { slug: "functional-fitness", label: "Functional Fitness", professions: ["personal-trainer"] },
  { slug: "hybrid-training", label: "Hybrid Training", professions: ["personal-trainer"] },
  { slug: "general-fitness", label: "General Fitness", professions: ["personal-trainer"] },
  { slug: "body-recomposition", label: "Body Recomposition", professions: ["personal-trainer"] },
  { slug: "fat-loss-transformation", label: "Fat Loss Transformation", professions: ["personal-trainer"] },
  { slug: "powerbuilding", label: "Powerbuilding", professions: ["personal-trainer"] },
  { slug: "calisthenics", label: "Calisthenics", professions: ["personal-trainer"] },
  { slug: "bodyweight-training", label: "Bodyweight Training", professions: ["personal-trainer"] },
  { slug: "kettlebell-training", label: "Kettlebell Training", professions: ["personal-trainer"] },
  { slug: "crossfit-style-pt", label: "CrossFit-Style Training", professions: ["personal-trainer"] },
  { slug: "glute-training", label: "Glute Training", professions: ["personal-trainer"] },
  { slug: "arm-specialisation", label: "Arm Specialisation", professions: ["personal-trainer"] },
  { slug: "core-abs-pt", label: "Core & Abs", professions: ["personal-trainer"] },
  { slug: "deadlift-focus", label: "Deadlift Focus", professions: ["personal-trainer"] },
  { slug: "squat-focus", label: "Squat Focus", professions: ["personal-trainer"] },
  { slug: "bench-focus", label: "Bench Press Focus", professions: ["personal-trainer"] },
  { slug: "olympic-lift-intro", label: "Olympic Lift Intro", professions: ["personal-trainer"] },
  { slug: "plyometrics", label: "Plyometrics", professions: ["personal-trainer"] },
  { slug: "agility-speed-pt", label: "Agility & Speed", professions: ["personal-trainer"] },
  { slug: "endurance-running", label: "Endurance & Running", professions: ["personal-trainer"] },
  { slug: "triathlon-prep", label: "Triathlon Prep", professions: ["personal-trainer"] },
  { slug: "hyrox-prep", label: "HYROX Prep", professions: ["personal-trainer"] },
  { slug: "hyrox-doubles", label: "HYROX Doubles Prep", professions: ["personal-trainer"] },
  { slug: "marathon-prep", label: "Marathon Prep", professions: ["personal-trainer"] },
  { slug: "obstacle-race-prep", label: "Obstacle Race Prep", professions: ["personal-trainer"] },
  { slug: "murph-prep", label: "Hero WOD / Murph Prep", professions: ["personal-trainer"] },
  { slug: "golf-fitness", label: "Golf Fitness", professions: ["personal-trainer"] },
  { slug: "tennis-fitness", label: "Tennis Fitness", professions: ["personal-trainer"] },
  { slug: "pre-post-natal", label: "Pre & Post-Natal", professions: ["personal-trainer"] },
  { slug: "menopause", label: "Menopause", professions: ["personal-trainer"] },
  { slug: "over-50s", label: "Over-50s", professions: ["personal-trainer"] },
  { slug: "youth-training", label: "Youth (under-18s)", professions: ["personal-trainer"] },
  { slug: "rehab-return-to-training", label: "Rehab & Return-to-Training", professions: ["personal-trainer"] },
  { slug: "chronic-pain", label: "Chronic Pain", professions: ["personal-trainer"] },
  { slug: "arthritis", label: "Arthritis", professions: ["personal-trainer"] },
  { slug: "cancer-recovery", label: "Cancer Recovery", professions: ["personal-trainer"] },
  { slug: "cardiac-rehab", label: "Cardiac Rehab", professions: ["personal-trainer"] },
  { slug: "diabetes-training", label: "Diabetes Training", professions: ["personal-trainer"] },
  { slug: "hypertension-training", label: "Hypertension Training", professions: ["personal-trainer"] },
  { slug: "adaptive-inclusive-pt", label: "Adaptive & Inclusive", professions: ["personal-trainer"] },
  { slug: "mobility", label: "Mobility", professions: ["personal-trainer"] },
  { slug: "posture-back-pain", label: "Posture & Back Pain", professions: ["personal-trainer"] },
  { slug: "weight-management", label: "Weight Management", professions: ["personal-trainer"] },
  { slug: "habit-lifestyle", label: "Habit & Lifestyle", professions: ["personal-trainer"] },
  { slug: "home-gym-coaching", label: "Home Gym Coaching", professions: ["personal-trainer"] },
  { slug: "home-visit-pt", label: "Home Visits", professions: ["personal-trainer"] },
  { slug: "park-outdoor-pt", label: "Park / Outdoor PT", professions: ["personal-trainer"] },
  { slug: "hotel-gym-pt", label: "Hotel Gym PT", professions: ["personal-trainer"] },
  { slug: "semi-private-pt", label: "Semi-Private PT", professions: ["personal-trainer"] },
  { slug: "small-group-pt", label: "Small-Group PT", professions: ["personal-trainer"] },
  { slug: "couples-training", label: "Couples Training", professions: ["personal-trainer"] },
  { slug: "corporate-wellness", label: "Corporate Wellness", professions: ["personal-trainer"] },
  { slug: "online-coaching", label: "Online Coaching", professions: ["personal-trainer"] },
  { slug: "hybrid-online-in-person", label: "Hybrid Online + In-Person", professions: ["personal-trainer"] },
];

const GROUP_FITNESS: Specialism[] = [
  { slug: "indoor-cycling-spin", label: "Indoor Cycling / Spin", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-rpm", label: "Les Mills RPM", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-sprint", label: "Les Mills SPRINT", professions: ["group-fitness-instructor"] },
  { slug: "bodypump-barbell", label: "BodyPump / Barbell", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-tone", label: "Les Mills Tone", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-cxworx", label: "Les Mills CXWORX", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-bodycombat", label: "Les Mills BodyCombat", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-bodyattack", label: "Les Mills BodyAttack", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-bodybalance", label: "Les Mills BodyBalance", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-bodyjam", label: "Les Mills BodyJam", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-shbam", label: "Les Mills SH'BAM", professions: ["group-fitness-instructor"] },
  { slug: "les-mills-grit", label: "Les Mills GRIT", professions: ["group-fitness-instructor"] },
  { slug: "hiit", label: "HIIT", professions: ["group-fitness-instructor"] },
  { slug: "tabata-class", label: "Tabata", professions: ["group-fitness-instructor"] },
  { slug: "insanity", label: "Insanity", professions: ["group-fitness-instructor"] },
  { slug: "bootcamp", label: "Bootcamp", professions: ["group-fitness-instructor"] },
  { slug: "outdoor-bootcamp", label: "Outdoor Bootcamp", professions: ["group-fitness-instructor"] },
  { slug: "circuits", label: "Circuits", professions: ["group-fitness-instructor"] },
  { slug: "metcon-class", label: "MetCon", professions: ["group-fitness-instructor"] },
  { slug: "functional-training-class", label: "Functional Training", professions: ["group-fitness-instructor"] },
  { slug: "kettlebell-flow-class", label: "Kettlebell Flow", professions: ["group-fitness-instructor"] },
  { slug: "kettlebells-class", label: "Kettlebells", professions: ["group-fitness-instructor"] },
  { slug: "sports-conditioning-class", label: "Sports Conditioning", professions: ["group-fitness-instructor"] },
  { slug: "primal-movement", label: "Primal Movement", professions: ["group-fitness-instructor"] },
  { slug: "step", label: "Step", professions: ["group-fitness-instructor"] },
  { slug: "aqua-aerobics", label: "Aqua Aerobics", professions: ["group-fitness-instructor"] },
  { slug: "aqua-hiit", label: "Aqua HIIT", professions: ["group-fitness-instructor"] },
  { slug: "aqua-strength", label: "Aqua Strength", professions: ["group-fitness-instructor"] },
  { slug: "dance-fitness-zumba", label: "Dance Fitness / Zumba", professions: ["group-fitness-instructor"] },
  { slug: "dance-cardio", label: "Dance Cardio", professions: ["group-fitness-instructor"] },
  { slug: "hip-hop-dance", label: "Hip-Hop Dance", professions: ["group-fitness-instructor"] },
  { slug: "ballet-fit", label: "Ballet Fit", professions: ["group-fitness-instructor"] },
  { slug: "barre", label: "Barre", professions: ["group-fitness-instructor"] },
  { slug: "box-fit", label: "Box-Fit", professions: ["group-fitness-instructor"] },
  { slug: "boxing-fitness", label: "Boxing Fitness", professions: ["group-fitness-instructor"] },
  { slug: "kickboxing-class", label: "Kickboxing", professions: ["group-fitness-instructor"] },
  { slug: "mma-fitness", label: "MMA Fitness", professions: ["group-fitness-instructor"] },
  { slug: "senior-fitness-class", label: "Senior Fitness", professions: ["group-fitness-instructor"] },
  { slug: "chair-based-class", label: "Chair-Based Fitness", professions: ["group-fitness-instructor"] },
  { slug: "silversneakers-style", label: "Active-Ageing Class", professions: ["group-fitness-instructor"] },
  { slug: "teen-fitness-class", label: "Teen Fitness", professions: ["group-fitness-instructor"] },
  { slug: "family-fitness", label: "Family Fitness", professions: ["group-fitness-instructor"] },
  { slug: "disability-inclusive-class", label: "Disability-Inclusive", professions: ["group-fitness-instructor"] },
  { slug: "mobility-class", label: "Mobility Class", professions: ["group-fitness-instructor"] },
  { slug: "stretch-class", label: "Stretch Class", professions: ["group-fitness-instructor"] },
  { slug: "foam-roll-class", label: "Foam Roll & Recovery", professions: ["group-fitness-instructor"] },
  { slug: "wellness-flow", label: "Wellness Flow", professions: ["group-fitness-instructor"] },
  { slug: "pre-post-natal-class", label: "Pre & Post-Natal Class", professions: ["group-fitness-instructor"] },
  { slug: "express-30", label: "Express 30", professions: ["group-fitness-instructor"] },
  { slug: "lunchtime-express", label: "Lunchtime Express", professions: ["group-fitness-instructor"] },
  { slug: "virtual-class", label: "Virtual Class", professions: ["group-fitness-instructor"] },
  { slug: "live-stream-class", label: "Live-Stream Class", professions: ["group-fitness-instructor"] },
];

const STRENGTH_COACH: Specialism[] = [
  { slug: "powerlifting", label: "Powerlifting", professions: ["strength-coach"] },
  { slug: "olympic-weightlifting", label: "Olympic Weightlifting", professions: ["strength-coach"] },
  { slug: "hypertrophy", label: "Hypertrophy", professions: ["strength-coach"] },
  { slug: "natural-bodybuilding", label: "Natural Bodybuilding", professions: ["strength-coach"] },
  { slug: "physique-competition", label: "Physique Competition", professions: ["strength-coach"] },
  { slug: "bodybuilding-classic", label: "Classic Bodybuilding", professions: ["strength-coach"] },
  { slug: "strongman", label: "Strongman", professions: ["strength-coach"] },
  { slug: "strongwoman", label: "Strongwoman", professions: ["strength-coach"] },
  { slug: "crossfit-competitive", label: "CrossFit Competitive", professions: ["strength-coach"] },
  { slug: "hyrox-athlete-sc", label: "HYROX Athlete S&C", professions: ["strength-coach"] },
  { slug: "athletic-performance", label: "Athletic Performance", professions: ["strength-coach"] },
  { slug: "speed-power", label: "Speed & Power", professions: ["strength-coach"] },
  { slug: "jump-training", label: "Jump Training", professions: ["strength-coach"] },
  { slug: "sprint-mechanics", label: "Sprint Mechanics", professions: ["strength-coach"] },
  { slug: "change-of-direction", label: "Change of Direction", professions: ["strength-coach"] },
  { slug: "agility-sc", label: "Agility", professions: ["strength-coach"] },
  { slug: "plyometric-programming", label: "Plyometric Programming", professions: ["strength-coach"] },
  { slug: "block-periodisation", label: "Block Periodisation", professions: ["strength-coach"] },
  { slug: "conjugate-method", label: "Conjugate Method", professions: ["strength-coach"] },
  { slug: "5-3-1-programming", label: "5/3/1 Programming", professions: ["strength-coach"] },
  { slug: "linear-progression", label: "Linear Progression", professions: ["strength-coach"] },
  { slug: "gpp-sc", label: "General Physical Preparedness", professions: ["strength-coach"] },
  { slug: "return-to-sport", label: "Return to Sport", professions: ["strength-coach"] },
  { slug: "youth-athlete-development", label: "Youth Athlete Development", professions: ["strength-coach"] },
  { slug: "masters-athlete", label: "Masters Athlete", professions: ["strength-coach"] },
  { slug: "tactical-first-responder", label: "Tactical / First Responder", professions: ["strength-coach"] },
  { slug: "military-prep", label: "Military Selection Prep", professions: ["strength-coach"] },
  { slug: "police-fire-prep", label: "Police / Fire Prep", professions: ["strength-coach"] },
  { slug: "combat-sports-sc", label: "Combat Sports S&C", professions: ["strength-coach"] },
  { slug: "mixed-martial-arts-sc", label: "MMA S&C", professions: ["strength-coach"] },
  { slug: "boxing-sc", label: "Boxing S&C", professions: ["strength-coach"] },
  { slug: "wrestling-sc", label: "Wrestling S&C", professions: ["strength-coach"] },
  { slug: "jiu-jitsu-sc", label: "Jiu-Jitsu S&C", professions: ["strength-coach"] },
  { slug: "judo-sc", label: "Judo S&C", professions: ["strength-coach"] },
  { slug: "endurance-athlete-sc", label: "Endurance Athlete S&C", professions: ["strength-coach"] },
  { slug: "running-sc", label: "Running S&C", professions: ["strength-coach"] },
  { slug: "cycling-sc", label: "Cycling S&C", professions: ["strength-coach"] },
  { slug: "swimming-sc", label: "Swimming S&C", professions: ["strength-coach"] },
  { slug: "rowing-sc", label: "Rowing S&C", professions: ["strength-coach"] },
  { slug: "triathlon-sc", label: "Triathlon S&C", professions: ["strength-coach"] },
  { slug: "team-sport-sc", label: "Team Sport S&C", professions: ["strength-coach"] },
  { slug: "field-sport-sc", label: "Field Sport S&C", professions: ["strength-coach"] },
  { slug: "court-sport-sc", label: "Court Sport S&C", professions: ["strength-coach"] },
  { slug: "rugby-sc", label: "Rugby S&C", professions: ["strength-coach"] },
  { slug: "football-sc", label: "Football S&C", professions: ["strength-coach"] },
  { slug: "hockey-sc", label: "Hockey S&C", professions: ["strength-coach"] },
  { slug: "cricket-sc", label: "Cricket S&C", professions: ["strength-coach"] },
  { slug: "basketball-sc", label: "Basketball S&C", professions: ["strength-coach"] },
  { slug: "netball-sc", label: "Netball S&C", professions: ["strength-coach"] },
  { slug: "tennis-sc", label: "Tennis S&C", professions: ["strength-coach"] },
  { slug: "golf-sc", label: "Golf S&C", professions: ["strength-coach"] },
  { slug: "motorsport-sc", label: "Motorsport S&C", professions: ["strength-coach"] },
  { slug: "esports-performance", label: "Esports Performance", professions: ["strength-coach"] },
  { slug: "pre-post-natal-strength", label: "Pre & Post-Natal Strength", professions: ["strength-coach"] },
  { slug: "competition-prep", label: "Competition Prep", professions: ["strength-coach"] },
  { slug: "remote-programming-sc", label: "Remote Programming", professions: ["strength-coach"] },
];

const PILATES: Specialism[] = [
  { slug: "mat-pilates", label: "Mat Pilates", professions: ["pilates-instructor"] },
  { slug: "reformer-pilates", label: "Reformer Pilates", professions: ["pilates-instructor"] },
  { slug: "cadillac-tower", label: "Cadillac / Tower", professions: ["pilates-instructor"] },
  { slug: "tower-mat", label: "Tower Mat", professions: ["pilates-instructor"] },
  { slug: "wunda-chair", label: "Wunda Chair", professions: ["pilates-instructor"] },
  { slug: "spine-corrector", label: "Spine Corrector", professions: ["pilates-instructor"] },
  { slug: "jumpboard", label: "Jumpboard", professions: ["pilates-instructor"] },
  { slug: "magic-circle", label: "Magic Circle", professions: ["pilates-instructor"] },
  { slug: "small-equipment-pilates", label: "Small Equipment", professions: ["pilates-instructor"] },
  { slug: "foam-roller-pilates", label: "Foam Roller Pilates", professions: ["pilates-instructor"] },
  { slug: "therapy-ball-pilates", label: "Therapy Ball Pilates", professions: ["pilates-instructor"] },
  { slug: "barre-pilates", label: "Barre Pilates", professions: ["pilates-instructor"] },
  { slug: "chair-pilates", label: "Chair Pilates", professions: ["pilates-instructor"] },
  { slug: "standing-pilates", label: "Standing Pilates", professions: ["pilates-instructor"] },
  { slug: "classical-pilates", label: "Classical Pilates", professions: ["pilates-instructor"] },
  { slug: "contemporary-pilates", label: "Contemporary Pilates", professions: ["pilates-instructor"] },
  { slug: "contrology-classical", label: "Contrology (Joseph Pilates)", professions: ["pilates-instructor"] },
  { slug: "stott-based", label: "STOTT-Based", professions: ["pilates-instructor"] },
  { slug: "polestar-based", label: "Polestar-Based", professions: ["pilates-instructor"] },
  { slug: "clinical-rehab-pilates", label: "Clinical / Rehab Pilates", professions: ["pilates-instructor"] },
  { slug: "pre-post-surgery-pilates", label: "Pre & Post-Surgery Pilates", professions: ["pilates-instructor"] },
  { slug: "pilates-for-scoliosis", label: "Pilates for Scoliosis", professions: ["pilates-instructor"] },
  { slug: "pilates-for-hypermobility", label: "Pilates for Hypermobility", professions: ["pilates-instructor"] },
  { slug: "pilates-for-osteoporosis", label: "Pilates for Osteoporosis", professions: ["pilates-instructor"] },
  { slug: "pilates-for-arthritis", label: "Pilates for Arthritis", professions: ["pilates-instructor"] },
  { slug: "back-care", label: "Back Care", professions: ["pilates-instructor"] },
  { slug: "pelvic-floor-pilates", label: "Pelvic Floor Pilates", professions: ["pilates-instructor"] },
  { slug: "pre-post-natal-pilates", label: "Pre & Post-Natal Pilates", professions: ["pilates-instructor"] },
  { slug: "prenatal-reformer", label: "Prenatal Reformer", professions: ["pilates-instructor"] },
  { slug: "postnatal-reformer", label: "Postnatal Reformer", professions: ["pilates-instructor"] },
  { slug: "over-50s-pilates", label: "Over-50s Pilates", professions: ["pilates-instructor"] },
  { slug: "mens-pilates", label: "Men's Pilates", professions: ["pilates-instructor"] },
  { slug: "youth-pilates", label: "Youth Pilates", professions: ["pilates-instructor"] },
  { slug: "athletic-pilates", label: "Athletic Pilates", professions: ["pilates-instructor"] },
  { slug: "pilates-for-runners", label: "Pilates for Runners", professions: ["pilates-instructor"] },
  { slug: "pilates-for-cyclists", label: "Pilates for Cyclists", professions: ["pilates-instructor"] },
  { slug: "pilates-for-swimmers", label: "Pilates for Swimmers", professions: ["pilates-instructor"] },
  { slug: "pilates-for-golfers", label: "Pilates for Golfers", professions: ["pilates-instructor"] },
  { slug: "pilates-for-tennis", label: "Pilates for Tennis", professions: ["pilates-instructor"] },
  { slug: "pilates-for-dancers", label: "Pilates for Dancers", professions: ["pilates-instructor"] },
  { slug: "pilates-for-athletes", label: "Pilates for Athletes", professions: ["pilates-instructor"] },
  { slug: "pilates-strength", label: "Pilates Strength", professions: ["pilates-instructor"] },
  { slug: "pilates-cardio", label: "Pilates Cardio", professions: ["pilates-instructor"] },
  { slug: "hiit-pilates", label: "HIIT Pilates", professions: ["pilates-instructor"] },
];

const YOGA: Specialism[] = [
  { slug: "vinyasa-flow", label: "Vinyasa Flow", professions: ["yoga-teacher"] },
  { slug: "slow-flow", label: "Slow Flow", professions: ["yoga-teacher"] },
  { slug: "dynamic-flow", label: "Dynamic Flow", professions: ["yoga-teacher"] },
  { slug: "mandala-flow", label: "Mandala Flow", professions: ["yoga-teacher"] },
  { slug: "hatha", label: "Hatha", professions: ["yoga-teacher"] },
  { slug: "yin", label: "Yin", professions: ["yoga-teacher"] },
  { slug: "yin-yang", label: "Yin/Yang", professions: ["yoga-teacher"] },
  { slug: "restorative", label: "Restorative", professions: ["yoga-teacher"] },
  { slug: "restorative-yin", label: "Restorative Yin", professions: ["yoga-teacher"] },
  { slug: "gentle-yoga", label: "Gentle Yoga", professions: ["yoga-teacher"] },
  { slug: "ashtanga", label: "Ashtanga", professions: ["yoga-teacher"] },
  { slug: "iyengar", label: "Iyengar", professions: ["yoga-teacher"] },
  { slug: "kundalini", label: "Kundalini", professions: ["yoga-teacher"] },
  { slug: "jivamukti", label: "Jivamukti", professions: ["yoga-teacher"] },
  { slug: "sivananda", label: "Sivananda", professions: ["yoga-teacher"] },
  { slug: "anusara", label: "Anusara", professions: ["yoga-teacher"] },
  { slug: "bikram", label: "Bikram", professions: ["yoga-teacher"] },
  { slug: "hot-yoga", label: "Hot Yoga", professions: ["yoga-teacher"] },
  { slug: "power-yoga", label: "Power Yoga", professions: ["yoga-teacher"] },
  { slug: "rocket-yoga", label: "Rocket Yoga", professions: ["yoga-teacher"] },
  { slug: "forrest-yoga", label: "Forrest Yoga", professions: ["yoga-teacher"] },
  { slug: "dharma-yoga", label: "Dharma Yoga", professions: ["yoga-teacher"] },
  { slug: "aerial-yoga", label: "Aerial Yoga", professions: ["yoga-teacher"] },
  { slug: "acro-yoga", label: "Acro Yoga", professions: ["yoga-teacher"] },
  { slug: "sup-yoga", label: "SUP Yoga", professions: ["yoga-teacher"] },
  { slug: "chair-yoga", label: "Chair Yoga", professions: ["yoga-teacher"] },
  { slug: "chair-yoga-seniors", label: "Chair Yoga for Seniors", professions: ["yoga-teacher"] },
  { slug: "kids-yoga", label: "Kids Yoga", professions: ["yoga-teacher"] },
  { slug: "mens-yoga", label: "Men's Yoga", professions: ["yoga-teacher"] },
  { slug: "pregnancy-yoga", label: "Pregnancy Yoga", professions: ["yoga-teacher"] },
  { slug: "postnatal-yoga", label: "Postnatal Yoga", professions: ["yoga-teacher"] },
  { slug: "yoga-for-fertility", label: "Yoga for Fertility", professions: ["yoga-teacher"] },
  { slug: "yoga-for-menopause", label: "Yoga for Menopause", professions: ["yoga-teacher"] },
  { slug: "yoga-for-hormones", label: "Yoga for Hormones", professions: ["yoga-teacher"] },
  { slug: "yoga-for-back-pain", label: "Yoga for Back Pain", professions: ["yoga-teacher"] },
  { slug: "yoga-for-athletes", label: "Yoga for Athletes", professions: ["yoga-teacher"] },
  { slug: "yoga-for-runners", label: "Yoga for Runners", professions: ["yoga-teacher"] },
  { slug: "yoga-for-anxiety", label: "Yoga for Anxiety", professions: ["yoga-teacher"] },
  { slug: "yoga-for-depression", label: "Yoga for Depression", professions: ["yoga-teacher"] },
  { slug: "yoga-for-sleep", label: "Yoga for Sleep", professions: ["yoga-teacher"] },
  { slug: "trauma-informed-yoga", label: "Trauma-Informed Yoga", professions: ["yoga-teacher"] },
  { slug: "yoga-therapy", label: "Yoga Therapy", professions: ["yoga-teacher"] },
  { slug: "meditation-breathwork", label: "Meditation & Breathwork", professions: ["yoga-teacher"] },
  { slug: "pranayama", label: "Pranayama", professions: ["yoga-teacher"] },
  { slug: "yoga-nidra", label: "Yoga Nidra", professions: ["yoga-teacher"] },
  { slug: "yoga-nidra-deep-rest", label: "Yoga Nidra Deep Rest", professions: ["yoga-teacher"] },
  { slug: "sound-healing", label: "Sound Healing", professions: ["yoga-teacher"] },
  { slug: "mantra-chanting", label: "Mantra & Chanting", professions: ["yoga-teacher"] },
  { slug: "philosophy-yoga", label: "Yoga Philosophy", professions: ["yoga-teacher"] },
  { slug: "ayurveda-yoga", label: "Ayurveda-Informed Yoga", professions: ["yoga-teacher"] },
  { slug: "corporate-yoga", label: "Corporate Yoga", professions: ["yoga-teacher"] },
  { slug: "office-desk-yoga", label: "Office / Desk Yoga", professions: ["yoga-teacher"] },
  { slug: "yoga-teacher-training-mentor", label: "Teacher Training Mentor", professions: ["yoga-teacher"] },
];

const NUTRITIONIST: Specialism[] = [
  { slug: "weight-management", label: "Weight Management", professions: ["nutritionist"] },
  { slug: "muscle-gain-nutrition", label: "Muscle Gain Nutrition", professions: ["nutritionist"] },
  { slug: "cutting-nutrition", label: "Cutting / Fat Loss Nutrition", professions: ["nutritionist"] },
  { slug: "contest-prep-nutrition", label: "Contest Prep Nutrition", professions: ["nutritionist"] },
  { slug: "sports-nutrition", label: "Sports Nutrition", professions: ["nutritionist"] },
  { slug: "endurance-nutrition", label: "Endurance Nutrition", professions: ["nutritionist"] },
  { slug: "physique-nutrition", label: "Physique Nutrition", professions: ["nutritionist"] },
  { slug: "gut-health", label: "Gut Health", professions: ["nutritionist"] },
  { slug: "ibs-nutrition", label: "IBS Nutrition", professions: ["nutritionist"] },
  { slug: "ibd-nutrition", label: "IBD Nutrition", professions: ["nutritionist"] },
  { slug: "low-fodmap", label: "Low-FODMAP", professions: ["nutritionist"] },
  { slug: "coeliac-gluten-free", label: "Coeliac / Gluten-Free", professions: ["nutritionist"] },
  { slug: "dairy-free", label: "Dairy-Free", professions: ["nutritionist"] },
  { slug: "food-allergies", label: "Food Allergies", professions: ["nutritionist"] },
  { slug: "food-intolerances", label: "Food Intolerances", professions: ["nutritionist"] },
  { slug: "plant-based", label: "Plant-Based", professions: ["nutritionist"] },
  { slug: "vegan-vegetarian", label: "Vegan / Vegetarian", professions: ["nutritionist"] },
  { slug: "mediterranean-diet", label: "Mediterranean Diet", professions: ["nutritionist"] },
  { slug: "keto-lchf", label: "Keto / LCHF", professions: ["nutritionist"] },
  { slug: "carnivore", label: "Carnivore", professions: ["nutritionist"] },
  { slug: "paleo", label: "Paleo", professions: ["nutritionist"] },
  { slug: "whole-food", label: "Whole-Food", professions: ["nutritionist"] },
  { slug: "anti-inflammatory", label: "Anti-Inflammatory", professions: ["nutritionist"] },
  { slug: "autoimmune-protocol", label: "Autoimmune Protocol", professions: ["nutritionist"] },
  { slug: "ramadan-nutrition", label: "Ramadan Nutrition", professions: ["nutritionist"] },
  { slug: "halal-nutrition", label: "Halal Nutrition", professions: ["nutritionist"] },
  { slug: "kosher-nutrition", label: "Kosher Nutrition", professions: ["nutritionist"] },
  { slug: "female-hormones", label: "Female Hormones", professions: ["nutritionist"] },
  { slug: "menopause-nutrition", label: "Menopause Nutrition", professions: ["nutritionist"] },
  { slug: "pcos-nutrition", label: "PCOS Nutrition", professions: ["nutritionist"] },
  { slug: "endometriosis-nutrition", label: "Endometriosis Nutrition", professions: ["nutritionist"] },
  { slug: "thyroid-nutrition", label: "Thyroid Nutrition", professions: ["nutritionist"] },
  { slug: "fertility-nutrition", label: "Fertility Nutrition", professions: ["nutritionist"] },
  { slug: "pregnancy-nutrition", label: "Pregnancy Nutrition", professions: ["nutritionist"] },
  { slug: "breastfeeding-nutrition", label: "Breastfeeding Nutrition", professions: ["nutritionist"] },
  { slug: "pre-post-natal-nutrition", label: "Pre & Post-Natal Nutrition", professions: ["nutritionist"] },
  { slug: "weaning-nutrition", label: "Weaning Nutrition", professions: ["nutritionist"] },
  { slug: "toddler-nutrition", label: "Toddler Nutrition", professions: ["nutritionist"] },
  { slug: "child-family-nutrition", label: "Child & Family Nutrition", professions: ["nutritionist"] },
  { slug: "teen-nutrition", label: "Teen Nutrition", professions: ["nutritionist"] },
  { slug: "youth-athlete-nutrition", label: "Youth Athlete Nutrition", professions: ["nutritionist"] },
  { slug: "senior-nutrition", label: "Senior Nutrition", professions: ["nutritionist"] },
  { slug: "clinical-conditions", label: "Clinical Conditions", professions: ["nutritionist"] },
  { slug: "diabetes-prediabetes", label: "Diabetes / Pre-diabetes", professions: ["nutritionist"] },
  { slug: "cardiovascular-nutrition", label: "Cardiovascular Nutrition", professions: ["nutritionist"] },
  { slug: "cognitive-brain-health", label: "Cognitive / Brain Health", professions: ["nutritionist"] },
  { slug: "longevity-nutrition", label: "Longevity Nutrition", professions: ["nutritionist"] },
  { slug: "immune-nutrition", label: "Immune Nutrition", professions: ["nutritionist"] },
  { slug: "skin-nutrition", label: "Skin Nutrition", professions: ["nutritionist"] },
  { slug: "hair-nail-nutrition", label: "Hair & Nail Nutrition", professions: ["nutritionist"] },
  { slug: "habit-behaviour-change", label: "Habit & Behaviour Change", professions: ["nutritionist"] },
  { slug: "intuitive-eating", label: "Intuitive Eating", professions: ["nutritionist"] },
  { slug: "mindful-eating", label: "Mindful Eating", professions: ["nutritionist"] },
  { slug: "disordered-eating-recovery", label: "Disordered Eating Recovery", professions: ["nutritionist"] },
  { slug: "mental-health-nutrition", label: "Mental Health Nutrition", professions: ["nutritionist"] },
  { slug: "alcohol-recovery", label: "Alcohol-Free / Recovery", professions: ["nutritionist"] },
  { slug: "addiction-recovery-nutrition", label: "Addiction Recovery", professions: ["nutritionist"] },
  { slug: "corporate-nutrition", label: "Corporate Nutrition", professions: ["nutritionist"] },
  { slug: "online-nutrition-coaching", label: "Online Nutrition Coaching", professions: ["nutritionist"] },
];

const FITNESS_INSTRUCTOR: Specialism[] = [
  { slug: "gym-floor-instruction", label: "Gym Floor Instruction", professions: ["fitness-instructor"] },
  { slug: "inductions-programme-cards", label: "Inductions & Programme Cards", professions: ["fitness-instructor"] },
  { slug: "new-member-onboarding", label: "New Member Onboarding", professions: ["fitness-instructor"] },
  { slug: "member-retention-floor", label: "Member Retention", professions: ["fitness-instructor"] },
  { slug: "class-cover", label: "Class Cover", professions: ["fitness-instructor"] },
  { slug: "circuits", label: "Circuits", professions: ["fitness-instructor"] },
  { slug: "functional-zone", label: "Functional Zone", professions: ["fitness-instructor"] },
  { slug: "functional-rig-coaching", label: "Functional Rig Coaching", professions: ["fitness-instructor"] },
  { slug: "sled-track-coaching", label: "Sled / Track Coaching", professions: ["fitness-instructor"] },
  { slug: "cardio-machines-coaching", label: "Cardio Machines Coaching", professions: ["fitness-instructor"] },
  { slug: "resistance-machines-coaching", label: "Resistance Machines Coaching", professions: ["fitness-instructor"] },
  { slug: "cable-machines-coaching", label: "Cable Machines Coaching", professions: ["fitness-instructor"] },
  { slug: "plate-loaded-coaching", label: "Plate-Loaded Coaching", professions: ["fitness-instructor"] },
  { slug: "smith-machine-coaching", label: "Smith Machine Coaching", professions: ["fitness-instructor"] },
  { slug: "hack-squat-coaching", label: "Hack Squat Coaching", professions: ["fitness-instructor"] },
  { slug: "leg-press-coaching", label: "Leg Press Coaching", professions: ["fitness-instructor"] },
  { slug: "assisted-machines", label: "Assisted Machines", professions: ["fitness-instructor"] },
  { slug: "free-weights-intro", label: "Free Weights Intro", professions: ["fitness-instructor"] },
  { slug: "studio-cycling-intro", label: "Studio Cycling Intro", professions: ["fitness-instructor"] },
  { slug: "stretch-corner", label: "Stretch Corner", professions: ["fitness-instructor"] },
  { slug: "foam-roll-corner", label: "Foam Roll Corner", professions: ["fitness-instructor"] },
  { slug: "older-adults", label: "Older Adults", professions: ["fitness-instructor"] },
  { slug: "seniors-morning-club", label: "Seniors Morning Club", professions: ["fitness-instructor"] },
  { slug: "youth-gym", label: "Youth Gym", professions: ["fitness-instructor"] },
  { slug: "teens-after-school", label: "Teens After-School", professions: ["fitness-instructor"] },
  { slug: "kids-club-fitness", label: "Kids Club", professions: ["fitness-instructor"] },
  { slug: "family-fitness-floor", label: "Family Fitness", professions: ["fitness-instructor"] },
  { slug: "women-only-hours", label: "Women-Only Hours", professions: ["fitness-instructor"] },
  { slug: "mens-hours", label: "Men-Only Hours", professions: ["fitness-instructor"] },
  { slug: "accessible-inclusive-fitness", label: "Accessible & Inclusive Fitness", professions: ["fitness-instructor"] },
  { slug: "adaptive-gym-floor", label: "Adaptive Gym Floor", professions: ["fitness-instructor"] },
  { slug: "wheelchair-accessible-floor", label: "Wheelchair-Accessible", professions: ["fitness-instructor"] },
  { slug: "blind-partially-sighted-fitness", label: "Blind / Partially-Sighted", professions: ["fitness-instructor"] },
  { slug: "deaf-fitness", label: "Deaf-Inclusive", professions: ["fitness-instructor"] },
  { slug: "learning-disability-fitness", label: "Learning Disability Inclusive", professions: ["fitness-instructor"] },
  { slug: "gp-referral", label: "GP Referral", professions: ["fitness-instructor"] },
  { slug: "health-checks", label: "Health Checks", professions: ["fitness-instructor"] },
  { slug: "bp-checks", label: "Blood Pressure Checks", professions: ["fitness-instructor"] },
  { slug: "body-comp-scans", label: "Body Composition Scans", professions: ["fitness-instructor"] },
  { slug: "inbody-scans", label: "InBody Scans", professions: ["fitness-instructor"] },
  { slug: "dexa-scans", label: "DEXA Scans", professions: ["fitness-instructor"] },
  { slug: "cardio-testing", label: "Cardio Testing", professions: ["fitness-instructor"] },
  { slug: "vo2-testing", label: "VO2 Testing", professions: ["fitness-instructor"] },
  { slug: "hydrotherapy-pool", label: "Hydrotherapy Pool", professions: ["fitness-instructor"] },
  { slug: "sauna-steam-guidance", label: "Sauna / Steam Guidance", professions: ["fitness-instructor"] },
  { slug: "hotel-gym-instruction", label: "Hotel Gym Instruction", professions: ["fitness-instructor"] },
  { slug: "university-gym", label: "University Gym", professions: ["fitness-instructor"] },
  { slug: "community-gym", label: "Community Gym", professions: ["fitness-instructor"] },
  { slug: "corporate-gym-floor", label: "Corporate Gym Floor", professions: ["fitness-instructor"] },
  { slug: "night-shift-cover", label: "Night-Shift Cover", professions: ["fitness-instructor"] },
  { slug: "weekend-cover", label: "Weekend Cover", professions: ["fitness-instructor"] },
];

export const SPECIALISMS_BY_PROFESSION: Record<ProfessionSlug, Specialism[]> = {
  "personal-trainer": PERSONAL_TRAINER,
  "group-fitness-instructor": GROUP_FITNESS,
  "strength-coach": STRENGTH_COACH,
  "pilates-instructor": PILATES,
  "yoga-teacher": YOGA,
  "nutritionist": NUTRITIONIST,
  "fitness-instructor": FITNESS_INSTRUCTOR,
};

/* -------------------------------------------------------------------------- */
/* Derived flat lookups                                                       */
/* -------------------------------------------------------------------------- */

/** Every specialism across all professions (deduped by slug). */
export const ALL_SPECIALISMS: Specialism[] = (() => {
  const seen = new Map<string, Specialism>();
  for (const [prof, list] of Object.entries(SPECIALISMS_BY_PROFESSION)) {
    for (const s of list) {
      const existing = seen.get(s.slug);
      if (existing) {
        // merge professions array
        if (!existing.professions.includes(prof as ProfessionSlug)) {
          existing.professions.push(prof as ProfessionSlug);
        }
      } else {
        seen.set(s.slug, { ...s, professions: [...s.professions] });
      }
    }
  }
  return Array.from(seen.values());
})();

export type SpecialismSlug = string;

export const SPECIALISM_SLUGS: string[] = ALL_SPECIALISMS.map((s) => s.slug);

const LABEL_BY_SLUG: Record<string, string> = Object.fromEntries(
  ALL_SPECIALISMS.map((s) => [s.slug, s.label]),
);

const SLUG_SET: Set<string> = new Set(SPECIALISM_SLUGS);

export function getSpecialismLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return LABEL_BY_SLUG[slug] ?? null;
}

export function isSpecialismSlug(s: unknown): s is string {
  return typeof s === "string" && SLUG_SET.has(s);
}

export function getSpecialismsForProfession(
  profession: ProfessionSlug | null | undefined,
): Specialism[] {
  if (!profession) return [];
  return SPECIALISMS_BY_PROFESSION[profession] ?? [];
}

export function isSpecialismValidForProfession(
  slug: string | null | undefined,
  profession: ProfessionSlug | null | undefined,
): boolean {
  if (!slug || !profession) return false;
  const list = SPECIALISMS_BY_PROFESSION[profession];
  if (!list) return false;
  return list.some((s) => s.slug === slug);
}

/* -------------------------------------------------------------------------- */
/* Legacy-slug mapping (used by title-rules → verification auto-merge)        */
/* -------------------------------------------------------------------------- */

/**
 * Internal vocabulary kept by the qualification rules engine. These slugs
 * are no longer valid for storage on professionals.specialisms; the
 * verification approval flow maps them to a new profession-scoped slug
 * via `mapLegacySpecialism()`.
 */
export type LegacySpecialismSlug =
  | "fat-loss"
  | "muscle-gain"
  | "strength"
  | "hybrid-functional"
  | "endurance-running"
  | "sports-performance"
  | "pre-post-natal"
  | "over-50s"
  | "youth"
  | "rehab-injury"
  | "mobility"
  | "posture-back-pain"
  | "weight-management"
  | "habit-lifestyle"
  | "nutrition-coaching"
  | "online-coaching";

const LEGACY_MAP: Record<LegacySpecialismSlug, Partial<Record<ProfessionSlug, string>>> = {
  "fat-loss": {
    "personal-trainer": "fat-loss",
    "nutritionist": "weight-management",
  },
  "muscle-gain": {
    "personal-trainer": "muscle-gain",
    "strength-coach": "hypertrophy",
  },
  "strength": {
    "personal-trainer": "strength-training",
    "strength-coach": "powerlifting",
  },
  "hybrid-functional": {
    "personal-trainer": "hybrid-training",
    "group-fitness-instructor": "circuits",
    "fitness-instructor": "functional-zone",
  },
  "endurance-running": {
    "personal-trainer": "endurance-running",
    "strength-coach": "endurance-athlete-sc",
    "pilates-instructor": "pilates-for-runners",
    "yoga-teacher": "yoga-for-runners",
    "nutritionist": "endurance-nutrition",
  },
  "sports-performance": {
    "strength-coach": "athletic-performance",
    "pilates-instructor": "pilates-for-athletes",
    "yoga-teacher": "yoga-for-athletes",
    "nutritionist": "sports-nutrition",
  },
  "pre-post-natal": {
    "personal-trainer": "pre-post-natal",
    "group-fitness-instructor": "pre-post-natal-class",
    "strength-coach": "pre-post-natal-strength",
    "pilates-instructor": "pre-post-natal-pilates",
    "yoga-teacher": "pregnancy-yoga",
    "nutritionist": "pre-post-natal-nutrition",
  },
  "over-50s": {
    "personal-trainer": "over-50s",
    "group-fitness-instructor": "senior-fitness-class",
    "strength-coach": "masters-athlete",
    "pilates-instructor": "over-50s-pilates",
    "yoga-teacher": "chair-yoga",
    "fitness-instructor": "older-adults",
  },
  "youth": {
    "personal-trainer": "youth-training",
    "strength-coach": "youth-athlete-development",
    "pilates-instructor": "youth-pilates",
    "yoga-teacher": "kids-yoga",
    "nutritionist": "child-family-nutrition",
    "fitness-instructor": "youth-gym",
  },
  "rehab-injury": {
    "personal-trainer": "rehab-return-to-training",
    "strength-coach": "return-to-sport",
    "pilates-instructor": "clinical-rehab-pilates",
    "yoga-teacher": "yoga-for-back-pain",
    "fitness-instructor": "gp-referral",
  },
  "mobility": {
    "personal-trainer": "mobility",
    "group-fitness-instructor": "mobility-class",
    "pilates-instructor": "mat-pilates",
    "yoga-teacher": "yin",
  },
  "posture-back-pain": {
    "personal-trainer": "posture-back-pain",
    "pilates-instructor": "back-care",
    "yoga-teacher": "yoga-for-back-pain",
  },
  "weight-management": {
    "personal-trainer": "weight-management",
    "nutritionist": "weight-management",
  },
  "habit-lifestyle": {
    "personal-trainer": "habit-lifestyle",
    "nutritionist": "habit-behaviour-change",
  },
  "nutrition-coaching": {
    "nutritionist": "online-nutrition-coaching",
  },
  "online-coaching": {
    "personal-trainer": "online-coaching",
    "nutritionist": "online-nutrition-coaching",
  },
};

export function mapLegacySpecialism(
  legacy: LegacySpecialismSlug,
  profession: ProfessionSlug | null | undefined,
): string | null {
  if (!profession) return null;
  return LEGACY_MAP[legacy]?.[profession] ?? null;
}
