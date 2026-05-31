# REPs Global Platform - Database Schema and Data Model

## 1. Purpose

This document defines the initial database schema and data model for the REPs Global Platform.

The schema is designed for a Supabase-backed Lovable application and must support the following product areas:

1. Public professional directory
2. Professional profiles and verification
3. Professional business dashboard
4. Leads and CRM
5. Clients and coaching delivery
6. Bookings and payments
7. Programmes, workouts and exercises
8. Nutrition plans
9. Check-ins and progress tracking
10. Reviews and reputation
11. CPD, qualifications and insurance records
12. Admin operations
13. Brilliant Directories migration
14. Future AI features

This document should be used after the Phase 1 visual screens have been built and approved. The visual source of truth remains the six locked mock-ups.

## 2. Core Data Principles

The REPs database must be designed around clean ownership, permission boundaries and long-term scalability.

### 2.1 Non-Negotiable Principles

1. **Auth users and profile records must be separate.** Supabase auth handles identity. Application tables store professional, client and admin data.
2. **Every record that belongs to an account must have a clear owner.** This is essential for row-level security.
3. **Public profile data must be separated from private professional data.** Visitors should only see approved public fields.
4. **Directory search must be optimised from the start.** Location, profession type, specialisms and verification status need first-class fields.
5. **Migration data must enter staging tables first.** Brilliant Directories data must not be imported directly into production tables.
6. **Professional business tools must support solo professionals and teams.** The model must handle one-person trainers, studios, facilities and multi-coach organisations.
7. **AI outputs must be reviewable and auditable.** AI suggestions should be stored separately from user-approved actions.
8. **Payments and subscriptions must be ledger-like.** Payment status, invoices and provider references must be stored clearly.
9. **Soft deletion is preferred for business-critical data.** Leads, clients, bookings and payments should not be permanently removed by normal users.
10. **Admin actions must be auditable.** Verification, moderation and support decisions need traceability.

## 3. Recommended Supabase Architecture

### 3.1 Main Schemas

Use the default `public` schema for application tables in the first build.

Future scaling option:

- `public` for application data
- `analytics` for reporting views
- `migration` for import staging
- `audit` for immutable event logs

For Lovable simplicity, start with `public` tables but name migration tables clearly using `migration_` prefixes.

### 3.2 Identity Model

Supabase `auth.users` is the source of authentication identity.

Application identity should be stored in:

- `profiles`
- `user_roles`
- `organisations`
- `organisation_members`

A user can be:

- a client
- a professional
- an organisation owner
- a staff coach
- a REPs admin
- a super admin

One user may hold multiple roles.

## 4. Enumerations

Create enums to keep status fields consistent.

```sql
create type user_role as enum (
  'public_user',
  'client',
  'professional',
  'organisation_owner',
  'staff_coach',
  'admin',
  'super_admin'
);

create type profile_status as enum (
  'draft',
  'pending_review',
  'published',
  'suspended',
  'archived'
);

create type verification_status as enum (
  'not_started',
  'pending',
  'verified',
  'rejected',
  'expired'
);

create type delivery_mode as enum (
  'in_person',
  'online',
  'hybrid'
);

create type lead_status as enum (
  'new',
  'contacted',
  'call_booked',
  'proposal_sent',
  'trial_booked',
  'won',
  'lost',
  'archived'
);

create type client_status as enum (
  'active',
  'paused',
  'at_risk',
  'completed',
  'cancelled',
  'archived'
);

create type booking_status as enum (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
);

create type payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled'
);

create type subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired'
);

create type review_status as enum (
  'pending',
  'published',
  'flagged',
  'rejected',
  'removed'
);

create type ai_suggestion_status as enum (
  'draft',
  'pending_review',
  'approved',
  'dismissed',
  'applied'
);
```

## 5. Core Tables

## 5.1 `profiles`

Stores application-level user profile data for every authenticated user.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text,
  email text,
  phone text,
  avatar_url text,
  country text,
  timezone text default 'Europe/London',
  preferred_language text default 'en',
  is_onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Notes

- `id` matches `auth.users.id`.
- This table is private to the logged-in user and authorised admins.
- Public-facing professional data lives in `professional_profiles` and `public_profiles`.

## 5.2 `user_roles`

Allows one user to hold multiple roles.

```sql
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  organisation_id uuid,
  created_at timestamptz default now(),
  unique(user_id, role, organisation_id)
);
```

### Notes

- `organisation_id` is nullable for platform-level roles.
- Admin roles must be granted only by super admins.

## 5.3 `organisations`

Supports gyms, studios, facilities and multi-coach businesses.

```sql
create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  organisation_type text,
  owner_user_id uuid references profiles(id),
  website_url text,
  logo_url text,
  billing_email text,
  phone text,
  country text,
  status profile_status default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 5.4 `organisation_members`

Connects users to organisations.

```sql
create table organisation_members (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  job_title text,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(organisation_id, user_id, role)
);
```

## 6. Professional Directory and Public Profile Tables

## 6.1 `professional_profiles`

Private professional record used by the logged-in professional and admin.

```sql
create table professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete set null,
  slug text unique not null,
  professional_title text,
  primary_profession text,
  bio text,
  years_experience integer,
  profile_photo_url text,
  cover_image_url text,
  website_url text,
  instagram_url text,
  facebook_url text,
  linkedin_url text,
  tiktok_url text,
  public_email text,
  public_phone text,
  profile_status profile_status default 'draft',
  verification_status verification_status default 'not_started',
  reps_member_number text,
  reps_level text,
  reps_score integer default 0,
  profile_completion_score integer default 0,
  accepts_online boolean default false,
  accepts_in_person boolean default true,
  accepts_hybrid boolean default false,
  base_country text,
  base_region text,
  base_city text,
  base_postcode text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Notes

- This is the master professional profile table.
- It includes private and admin-managed fields.
- Public exposure must be controlled by views or a separate `public_profiles` table.

## 6.2 `public_profiles`

Approved public-facing professional profile snapshot.

```sql
create table public_profiles (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  slug text unique not null,
  display_name text not null,
  professional_title text,
  primary_profession text,
  short_bio text,
  full_bio text,
  profile_photo_url text,
  cover_image_url text,
  public_location_label text,
  base_city text,
  base_region text,
  base_country text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  delivery_modes delivery_mode[] default array[]::delivery_mode[],
  verification_status verification_status default 'not_started',
  reps_level text,
  average_rating numeric(3, 2) default 0,
  review_count integer default 0,
  is_featured boolean default false,
  is_published boolean default false,
  published_at timestamptz,
  updated_at timestamptz default now()
);
```

### Notes

- Public search should read from this table or a materialised search view.
- Keep only data that is safe and approved for public display.

## 6.3 `profession_categories`

Directory category taxonomy.

```sql
create table profession_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  icon_name text,
  parent_id uuid references profession_categories(id),
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

Example categories:

- Personal Trainer
- Pilates Instructor
- Nutritionist
- Strength Coach
- Rehab Specialist
- Sports Coach
- Online Coaching
- Pre and Postnatal Specialist

## 6.4 `professional_profile_categories`

Many-to-many join between professionals and categories.

```sql
create table professional_profile_categories (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  category_id uuid not null references profession_categories(id) on delete cascade,
  is_primary boolean default false,
  created_at timestamptz default now(),
  unique(professional_profile_id, category_id)
);
```

## 6.5 `specialisms`

Specialism taxonomy.

```sql
create table specialisms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  icon_name text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

Example specialisms:

- Strength Training
- Fat Loss
- Muscle Gain
- Pilates
- Nutrition
- Mobility
- Rehabilitation
- Sports Performance
- Pre and Postnatal
- Older Adult Fitness
- Disability and Inclusive Fitness

## 6.6 `professional_profile_specialisms`

```sql
create table professional_profile_specialisms (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  specialism_id uuid not null references specialisms(id) on delete cascade,
  created_at timestamptz default now(),
  unique(professional_profile_id, specialism_id)
);
```

## 6.7 `professional_locations`

Stores service areas and specific delivery locations.

```sql
create table professional_locations (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  label text,
  location_type text,
  address_line_1 text,
  address_line_2 text,
  city text,
  region text,
  postcode text,
  country text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  radius_miles integer,
  is_primary boolean default false,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Location Types

- private_studio
- gym
- client_home
- outdoor
- online
- service_area

## 7. Verification, Qualifications, CPD and Insurance

## 7.1 `qualifications`

Stores qualification records submitted by professionals.

```sql
create table qualifications (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  qualification_name text not null,
  awarding_body text,
  qualification_level text,
  certificate_url text,
  certificate_number text,
  issue_date date,
  expiry_date date,
  verification_status verification_status default 'pending',
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 7.2 `insurance_records`

```sql
create table insurance_records (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  provider_name text,
  policy_number text,
  cover_type text,
  document_url text,
  start_date date,
  expiry_date date,
  verification_status verification_status default 'pending',
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 7.3 `cpd_records`

```sql
create table cpd_records (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  title text not null,
  provider_name text,
  cpd_points numeric(5, 2) default 0,
  completion_date date,
  certificate_url text,
  verification_status verification_status default 'pending',
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 7.4 `verification_events`

Audit trail for verification decisions.

```sql
create table verification_events (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid references professional_profiles(id) on delete cascade,
  related_table text,
  related_record_id uuid,
  previous_status verification_status,
  new_status verification_status,
  admin_user_id uuid references profiles(id),
  notes text,
  created_at timestamptz default now()
);
```

## 8. Services, Packages and Pricing

## 8.1 `services`

Professional services shown on public profiles and used in bookings.

```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  title text not null,
  slug text,
  description text,
  service_type text,
  delivery_mode delivery_mode,
  duration_minutes integer,
  price_amount numeric(10, 2),
  currency text default 'GBP',
  is_public boolean default true,
  is_bookable boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 8.2 `service_packages`

Packages such as 12-week coaching, monthly online coaching or blocks of sessions.

```sql
create table service_packages (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  title text not null,
  description text,
  package_type text,
  number_of_sessions integer,
  duration_weeks integer,
  price_amount numeric(10, 2),
  currency text default 'GBP',
  is_public boolean default true,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 9. Leads and CRM

## 9.1 `leads`

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete set null,
  assigned_user_id uuid references profiles(id),
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  status lead_status default 'new',
  goal text,
  message text,
  preferred_delivery_mode delivery_mode,
  preferred_location text,
  estimated_value numeric(10, 2),
  currency text default 'GBP',
  intent_score integer,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  converted_client_id uuid,
  lost_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

### Lead Sources

- public_profile
- directory_search
- manual_entry
- referral
- website
- campaign
- import

## 9.2 `lead_notes`

```sql
create table lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  author_user_id uuid references profiles(id),
  note text not null,
  created_at timestamptz default now()
);
```

## 9.3 `lead_activities`

Timeline of calls, emails, status changes and follow-ups.

```sql
create table lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  activity_type text not null,
  title text,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

## 10. Clients and Coaching Relationships

## 10.1 `clients`

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  first_name text,
  last_name text,
  email text,
  phone text,
  avatar_url text,
  status client_status default 'active',
  source_lead_id uuid references leads(id),
  primary_goal text,
  training_experience text,
  notes text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  joined_at timestamptz default now(),
  last_active_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

## 10.2 `client_health_forms`

Stores PAR-Q style onboarding and health screening data.

```sql
create table client_health_forms (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  form_type text default 'par_q',
  responses jsonb not null default '{}'::jsonb,
  submitted_at timestamptz default now(),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  notes text
);
```

## 10.3 `client_metrics`

Progress data such as weight, measurements and other tracked metrics.

```sql
create table client_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  recorded_at timestamptz default now(),
  body_weight_kg numeric(6, 2),
  body_fat_percentage numeric(5, 2),
  waist_cm numeric(6, 2),
  hip_cm numeric(6, 2),
  chest_cm numeric(6, 2),
  notes text,
  created_by uuid references profiles(id)
);
```

## 10.4 `progress_photos`

```sql
create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  image_url text not null,
  photo_type text,
  taken_at timestamptz default now(),
  visibility text default 'private',
  created_at timestamptz default now()
);
```

## 11. Bookings and Calendar

## 11.1 `bookings`

```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  title text not null,
  description text,
  location_label text,
  delivery_mode delivery_mode,
  meeting_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status booking_status default 'scheduled',
  price_amount numeric(10, 2),
  currency text default 'GBP',
  payment_status payment_status default 'pending',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  cancelled_at timestamptz,
  cancellation_reason text
);
```

## 11.2 `availability_rules`

```sql
create table availability_rules (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  location_label text,
  delivery_mode delivery_mode,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

## 11.3 `blocked_times`

```sql
create table blocked_times (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz default now()
);
```

## 12. Payments, Subscriptions and Memberships

## 12.1 `membership_plans`

REPs professional membership plans.

```sql
create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price_amount numeric(10, 2),
  currency text default 'GBP',
  billing_interval text,
  features jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

## 12.2 `memberships`

```sql
create table memberships (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid references professional_profiles(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete cascade,
  membership_plan_id uuid references membership_plans(id),
  status subscription_status default 'active',
  starts_at timestamptz,
  renews_at timestamptz,
  ends_at timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (
    professional_profile_id is not null or organisation_id is not null
  )
);
```

## 12.3 `payments`

```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  payer_user_id uuid references profiles(id),
  professional_profile_id uuid references professional_profiles(id) on delete set null,
  organisation_id uuid references organisations(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  membership_id uuid references memberships(id) on delete set null,
  amount numeric(10, 2) not null,
  currency text default 'GBP',
  status payment_status default 'pending',
  payment_type text,
  provider text,
  provider_payment_id text,
  provider_invoice_id text,
  paid_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  refunded_amount numeric(10, 2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 13. Programmes, Workouts and Exercises

## 13.1 `exercise_library`

Platform-wide or professional-owned exercise library.

```sql
create table exercise_library (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references profiles(id),
  name text not null,
  description text,
  category text,
  muscle_groups text[] default '{}',
  equipment text[] default '{}',
  difficulty text,
  video_url text,
  thumbnail_url text,
  coaching_notes text,
  is_global boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 13.2 `programmes`

```sql
create table programmes (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  description text,
  goal text,
  duration_weeks integer,
  start_date date,
  end_date date,
  status text default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 13.3 `programme_weeks`

```sql
create table programme_weeks (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programmes(id) on delete cascade,
  week_number integer not null,
  title text,
  notes text,
  unique(programme_id, week_number)
);
```

## 13.4 `workouts`

```sql
create table workouts (
  id uuid primary key default gen_random_uuid(),
  programme_week_id uuid references programme_weeks(id) on delete cascade,
  programme_id uuid references programmes(id) on delete cascade,
  title text not null,
  scheduled_date date,
  sort_order integer default 0,
  notes text,
  created_at timestamptz default now()
);
```

## 13.5 `workout_exercises`

```sql
create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid references exercise_library(id) on delete set null,
  exercise_name text not null,
  sets integer,
  reps text,
  load text,
  tempo text,
  rest_seconds integer,
  rpe text,
  notes text,
  sort_order integer default 0,
  created_at timestamptz default now()
);
```

## 13.6 `workout_completions`

```sql
create table workout_completions (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  completed_at timestamptz default now(),
  perceived_effort integer,
  notes text,
  completion_data jsonb default '{}'::jsonb,
  unique(workout_id, client_id)
);
```

## 14. Nutrition

## 14.1 `nutrition_plans`

```sql
create table nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  plan_type text,
  calories_target integer,
  protein_target_g integer,
  carbs_target_g integer,
  fat_target_g integer,
  notes text,
  start_date date,
  end_date date,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 14.2 `meal_templates`

```sql
create table meal_templates (
  id uuid primary key default gen_random_uuid(),
  nutrition_plan_id uuid references nutrition_plans(id) on delete cascade,
  professional_profile_id uuid references professional_profiles(id) on delete cascade,
  title text not null,
  meal_type text,
  description text,
  calories integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  ingredients jsonb default '[]'::jsonb,
  instructions text,
  created_at timestamptz default now()
);
```

## 14.3 `food_logs`

Client food logging for future phases.

```sql
create table food_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  logged_at timestamptz default now(),
  meal_type text,
  description text,
  photo_url text,
  calories_estimate integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  source text,
  ai_estimate jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

## 15. Check-ins, Habits and Progress

## 15.1 `check_in_templates`

```sql
create table check_in_templates (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  title text not null,
  description text,
  questions jsonb not null default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 15.2 `check_ins`

```sql
create table check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  template_id uuid references check_in_templates(id) on delete set null,
  due_at timestamptz,
  submitted_at timestamptz,
  status text default 'due',
  responses jsonb default '{}'::jsonb,
  coach_notes text,
  ai_summary text,
  ai_risk_score integer,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 15.3 `habits`

```sql
create table habits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  title text not null,
  description text,
  frequency text,
  target_value numeric(10, 2),
  unit text,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

## 15.4 `habit_logs`

```sql
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  logged_for date not null,
  value numeric(10, 2),
  completed boolean default false,
  notes text,
  created_at timestamptz default now(),
  unique(habit_id, client_id, logged_for)
);
```

## 16. Messaging and Notifications

## 16.1 `conversations`

```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid references professional_profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  subject text,
  last_message_at timestamptz,
  created_at timestamptz default now()
);
```

## 16.2 `messages`

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_user_id uuid references profiles(id),
  body text not null,
  attachment_urls text[] default '{}',
  read_at timestamptz,
  created_at timestamptz default now()
);
```

## 16.3 `notifications`

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  notification_type text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz default now()
);
```

## 17. Reviews and Reputation

## 17.1 `reviews`

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  reviewer_name text,
  reviewer_email text,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  service_id uuid references services(id) on delete set null,
  status review_status default 'pending',
  is_verified_client boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 17.2 `review_responses`

```sql
create table review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  professional_profile_id uuid not null references professional_profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 17.3 `review_reports`

```sql
create table review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  reported_by uuid references profiles(id),
  reason text,
  status text default 'open',
  admin_notes text,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  created_at timestamptz default now()
);
```

## 18. Content Studio and Public Articles

## 18.1 `content_posts`

```sql
create table content_posts (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid references professional_profiles(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete cascade,
  title text not null,
  slug text,
  excerpt text,
  body text,
  content_type text,
  status text default 'draft',
  featured_image_url text,
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 19. AI Layer Tables

AI must be assistive, reviewable and auditable.

## 19.1 `ai_suggestions`

```sql
create table ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid references professional_profiles(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  related_table text,
  related_record_id uuid,
  suggestion_type text not null,
  title text,
  summary text,
  suggested_action jsonb default '{}'::jsonb,
  priority integer default 0,
  status ai_suggestion_status default 'pending_review',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);
```

## 19.2 `ai_logs`

```sql
create table ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  professional_profile_id uuid references professional_profiles(id) on delete set null,
  feature_name text not null,
  input_summary text,
  output_summary text,
  model_name text,
  token_usage jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

## 20. Admin, Support and Audit

## 20.1 `admin_notes`

```sql
create table admin_notes (
  id uuid primary key default gen_random_uuid(),
  related_table text not null,
  related_record_id uuid not null,
  admin_user_id uuid references profiles(id),
  note text not null,
  created_at timestamptz default now()
);
```

## 20.2 `support_tickets`

```sql
create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  organisation_id uuid references organisations(id) on delete set null,
  subject text not null,
  description text,
  status text default 'open',
  priority text default 'normal',
  assigned_admin_id uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  closed_at timestamptz
);
```

## 20.3 `audit_events`

Immutable audit trail for important admin and system events.

```sql
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references profiles(id),
  action text not null,
  related_table text,
  related_record_id uuid,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);
```

## 21. Brilliant Directories Migration Tables

Migration must be staged, validated and then promoted into production tables.

## 21.1 `migration_import_batches`

```sql
create table migration_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_system text default 'brilliant_directories',
  file_name text,
  uploaded_by uuid references profiles(id),
  row_count integer default 0,
  status text default 'uploaded',
  notes text,
  created_at timestamptz default now(),
  completed_at timestamptz
);
```

## 21.2 `migration_professional_rows`

Raw imported member rows.

```sql
create table migration_professional_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references migration_import_batches(id) on delete cascade,
  external_id text,
  raw_data jsonb not null,
  email text,
  name text,
  phone text,
  category text,
  location text,
  membership_level text,
  membership_status text,
  profile_url text,
  mapped_professional_profile_id uuid references professional_profiles(id),
  validation_status text default 'pending',
  validation_errors jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 21.3 `migration_field_mappings`

```sql
create table migration_field_mappings (
  id uuid primary key default gen_random_uuid(),
  source_system text default 'brilliant_directories',
  source_field text not null,
  target_table text not null,
  target_field text not null,
  transform_rule text,
  is_required boolean default false,
  created_at timestamptz default now()
);
```

## 22. Recommended Indexes

Directory search, dashboard views and CRM workflows require indexes from the start.

```sql
create index idx_professional_profiles_user_id on professional_profiles(user_id);
create index idx_professional_profiles_slug on professional_profiles(slug);
create index idx_professional_profiles_status on professional_profiles(profile_status);
create index idx_professional_profiles_verification on professional_profiles(verification_status);
create index idx_professional_profiles_location on professional_profiles(base_city, base_region, base_country);

create index idx_public_profiles_slug on public_profiles(slug);
create index idx_public_profiles_published on public_profiles(is_published);
create index idx_public_profiles_verification on public_profiles(verification_status);
create index idx_public_profiles_location on public_profiles(base_city, base_region, base_country);
create index idx_public_profiles_rating on public_profiles(average_rating desc, review_count desc);

create index idx_professional_locations_profile on professional_locations(professional_profile_id);
create index idx_professional_locations_city on professional_locations(city, region, country);

create index idx_leads_professional_status on leads(professional_profile_id, status);
create index idx_leads_assigned_user on leads(assigned_user_id);
create index idx_leads_follow_up on leads(next_follow_up_at);

create index idx_clients_professional_status on clients(professional_profile_id, status);
create index idx_bookings_professional_start on bookings(professional_profile_id, starts_at);
create index idx_bookings_client_start on bookings(client_id, starts_at);

create index idx_payments_professional_status on payments(professional_profile_id, status);
create index idx_payments_created_at on payments(created_at);

create index idx_reviews_professional_status on reviews(professional_profile_id, status);
create index idx_check_ins_professional_status on check_ins(professional_profile_id, status);
create index idx_check_ins_due on check_ins(due_at);

create index idx_ai_suggestions_professional_status on ai_suggestions(professional_profile_id, status);
create index idx_notifications_user_read on notifications(user_id, read_at);
```

### Future PostGIS Index

For radius search, enable PostGIS in a later phase and replace numeric latitude/longitude-only searching with geography indexes.

Recommended future field:

```sql
-- Future only
-- location geography(Point, 4326)
```

## 23. Recommended Views

## 23.1 `directory_search_view`

Create a view or materialised view for public search.

Suggested fields:

- public_profile_id
- professional_profile_id
- slug
- display_name
- primary_profession
- short_bio
- profile_photo_url
- public_location_label
- city
- region
- country
- latitude
- longitude
- delivery_modes
- verification_status
- reps_level
- average_rating
- review_count
- categories
- specialisms
- is_featured
- is_published

## 23.2 `professional_dashboard_summary_view`

Dashboard summary fields:

- professional_profile_id
- monthly_revenue
- pending_revenue
- active_clients_count
- at_risk_clients_count
- client_adherence_percentage
- leads_count
- check_ins_due_count
- bookings_today_count
- reviews_average
- reviews_count
- cpd_points_current_cycle
- profile_completion_score
- reps_score

## 23.3 `admin_platform_overview_view`

Admin overview fields:

- total_professionals
- total_members
- new_registrations
- total_revenue
- pending_verifications
- reviews_pending
- support_tickets_open
- public_profiles_published

## 24. Row-Level Security Model

RLS must be enabled on all application tables before live data is imported.

### 24.1 General RLS Rules

1. Users can read and update their own `profiles` record.
2. Professionals can manage their own `professional_profiles` records.
3. Organisation owners can manage records belonging to their organisation.
4. Staff coaches can access records assigned to them or shared by their organisation.
5. Clients can access only their own portal data.
6. Public users can read only published public profile data.
7. Admins can access operational records required for verification, moderation and support.
8. Super admins can manage platform-level settings and admin users.

### 24.2 Example RLS Helper Functions

```sql
create or replace function is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role in ('admin', 'super_admin')
  );
$$;

create or replace function is_super_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role = 'super_admin'
  );
$$;
```

### 24.3 Example Policies

```sql
alter table profiles enable row level security;

create policy "Users can read their own profile"
on profiles for select
using (id = auth.uid() or is_admin());

create policy "Users can update their own profile"
on profiles for update
using (id = auth.uid())
with check (id = auth.uid());
```

```sql
alter table public_profiles enable row level security;

create policy "Anyone can read published public profiles"
on public_profiles for select
using (is_published = true);

create policy "Admins can manage public profiles"
on public_profiles for all
using (is_admin())
with check (is_admin());
```

```sql
alter table professional_profiles enable row level security;

create policy "Professionals can read their own professional profile"
on professional_profiles for select
using (user_id = auth.uid() or is_admin());

create policy "Professionals can update their own professional profile"
on professional_profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

## 25. Storage Buckets

Recommended Supabase storage buckets:

| Bucket | Purpose | Access |
|---|---|---|
| `avatars` | User and professional profile photos | Public read, owner write |
| `cover-images` | Professional cover images | Public read, owner write |
| `qualification-documents` | Certificates and credentials | Private, admin/professional access |
| `insurance-documents` | Insurance certificates | Private, admin/professional access |
| `cpd-documents` | CPD certificates | Private, admin/professional access |
| `progress-photos` | Client progress photos | Private |
| `message-attachments` | Message files | Private |
| `content-images` | Blog/article/content assets | Public read |
| `migration-imports` | CSV imports | Admin only |

## 26. Data Privacy and Compliance Notes

The platform will handle personal, professional and potentially health-related information. The schema must support privacy by design.

### 26.1 Sensitive Data Areas

Sensitive areas include:

- Client health forms
- Progress photos
- Client measurements
- Private messages
- Qualification documents
- Insurance documents
- Payment records
- Admin notes

### 26.2 Data Rules

- Public profile data must be explicitly published.
- Private client data must never be exposed to public users.
- Health form responses must be accessible only to the client, assigned professional, authorised organisation staff and admins where necessary.
- Progress photos must be private by default.
- Admin notes must not be visible to professionals or clients unless specifically designed later.
- Deletion requests must be handled carefully where financial, compliance or audit records must be retained.

## 27. MVP Table Priority

Do not build every table at once inside Lovable.

### Phase 2A - Minimum Directory and Auth Schema

Build first:

- profiles
- user_roles
- organisations
- organisation_members
- professional_profiles
- public_profiles
- profession_categories
- professional_profile_categories
- specialisms
- professional_profile_specialisms
- professional_locations
- services
- reviews
- membership_plans
- memberships

### Phase 2B - CRM and Bookings

Build next:

- leads
- lead_notes
- lead_activities
- clients
- bookings
- availability_rules
- blocked_times
- payments

### Phase 2C - Coaching Delivery

Build next:

- exercise_library
- programmes
- programme_weeks
- workouts
- workout_exercises
- workout_completions
- nutrition_plans
- meal_templates
- check_in_templates
- check_ins
- habits
- habit_logs
- client_metrics
- progress_photos

### Phase 2D - Verification and Admin

Build next:

- qualifications
- insurance_records
- cpd_records
- verification_events
- admin_notes
- support_tickets
- audit_events

### Phase 2E - AI and Migration

Build last:

- ai_suggestions
- ai_logs
- migration_import_batches
- migration_professional_rows
- migration_field_mappings

## 28. Lovable Build Instruction for Database Phase

Use this instruction when moving into the database phase:

**Create the Supabase database schema for the REPs Global Platform using the approved database model. Build the schema in phases. Start only with Phase 2A tables: profiles, user_roles, organisations, organisation_members, professional_profiles, public_profiles, profession_categories, professional_profile_categories, specialisms, professional_profile_specialisms, professional_locations, services, reviews, membership_plans and memberships. Enable row-level security. Create sensible indexes. Do not build CRM, bookings, payments, coaching delivery, AI or migration tables until instructed. Do not change the approved visual design or rebuild the UI.**

## 29. Immediate Next Step

The next document should be:

**REPs Global Platform - Lovable Build Prompt Pack**

That document will turn the approved mock-ups, visual system, page specifications and database model into a controlled sequence of Lovable prompts.

