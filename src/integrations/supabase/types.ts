export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          ip: unknown
          reason: string | null
          target_id: string | null
          target_table: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip?: unknown
          reason?: string | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip?: unknown
          reason?: string | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_impersonation_sessions: {
        Row: {
          admin_id: string | null
          created_at: string
          ended_at: string | null
          ended_reason: string | null
          ends_at: string
          id: string
          ip: unknown
          professional_id: string
          session_token: string
          started_at: string
          user_agent: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          ended_at?: string | null
          ended_reason?: string | null
          ends_at: string
          id?: string
          ip?: unknown
          professional_id: string
          session_token: string
          started_at?: string
          user_agent?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          ended_at?: string | null
          ended_reason?: string | null
          ends_at?: string
          id?: string
          ip?: unknown
          professional_id?: string
          session_token?: string
          started_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_pro_invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          email_message_id: string | null
          expires_at: string
          full_name: string | null
          id: string
          invite_url: string | null
          invited_by: string | null
          plan: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          email_message_id?: string | null
          expires_at?: string
          full_name?: string | null
          id?: string
          invite_url?: string | null
          invited_by?: string | null
          plan?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          email_message_id?: string | null
          expires_at?: string
          full_name?: string | null
          id?: string
          invite_url?: string | null
          invited_by?: string | null
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      auth_events: {
        Row: {
          browser: string | null
          city: string | null
          country_code: string | null
          created_at: string
          device: string | null
          email: string | null
          event: string
          geo_source: string | null
          id: string
          ip: string | null
          ip_hash: string | null
          latitude: number | null
          longitude: number | null
          os: string | null
          region: string | null
          timezone: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          email?: string | null
          event: string
          geo_source?: string | null
          id?: string
          ip?: string | null
          ip_hash?: string | null
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          region?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          email?: string | null
          event?: string
          geo_source?: string | null
          id?: string
          ip?: string | null
          ip_hash?: string | null
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          region?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bd_member_seed: {
        Row: {
          about_me: string | null
          address1: string | null
          address2: string | null
          bd_member_id: number
          bd_next_due_date: string | null
          city: string | null
          claim_status: Database["public"]["Enums"]["bd_member_claim_status"]
          claimed_user_id: string | null
          country_ln: string | null
          created_at: string
          credentials: string | null
          email: string
          experience: string | null
          first_name: string | null
          instagram: string | null
          last_name: string | null
          lat: number | null
          legacy_billing_period: string | null
          legacy_last_login_at: string | null
          legacy_plan: string | null
          legacy_signup_at: string | null
          linkedin: string | null
          lon: number | null
          migration_canonical_stripe_customer_id: string | null
          migration_charged_pence: number | null
          migration_cohort_override: string | null
          migration_cohort_reason: string | null
          migration_error: string | null
          migration_idempotency_key: string | null
          migration_ran_at: string | null
          migration_review_resolved: boolean
          migration_status: string | null
          migration_stripe_customer_id: string | null
          migration_stripe_invoice_id: string | null
          migration_stripe_schedule_id: string | null
          migration_stripe_subscription_id: string | null
          notes: string | null
          phone_raw: string | null
          profile_photo_reject_category: string | null
          profile_photo_reject_reason: string | null
          profile_photo_src: string | null
          profile_photo_status: Database["public"]["Enums"]["bd_member_photo_status"]
          profile_photo_storage_path: string | null
          quote: string | null
          recrop_reason: string | null
          recrop_status: string
          recropped_at: string | null
          service_areas: string | null
          services_text: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string
          website: string | null
          years_active: string | null
          youtube: string | null
          zip_code: string | null
        }
        Insert: {
          about_me?: string | null
          address1?: string | null
          address2?: string | null
          bd_member_id: number
          bd_next_due_date?: string | null
          city?: string | null
          claim_status?: Database["public"]["Enums"]["bd_member_claim_status"]
          claimed_user_id?: string | null
          country_ln?: string | null
          created_at?: string
          credentials?: string | null
          email: string
          experience?: string | null
          first_name?: string | null
          instagram?: string | null
          last_name?: string | null
          lat?: number | null
          legacy_billing_period?: string | null
          legacy_last_login_at?: string | null
          legacy_plan?: string | null
          legacy_signup_at?: string | null
          linkedin?: string | null
          lon?: number | null
          migration_canonical_stripe_customer_id?: string | null
          migration_charged_pence?: number | null
          migration_cohort_override?: string | null
          migration_cohort_reason?: string | null
          migration_error?: string | null
          migration_idempotency_key?: string | null
          migration_ran_at?: string | null
          migration_review_resolved?: boolean
          migration_status?: string | null
          migration_stripe_customer_id?: string | null
          migration_stripe_invoice_id?: string | null
          migration_stripe_schedule_id?: string | null
          migration_stripe_subscription_id?: string | null
          notes?: string | null
          phone_raw?: string | null
          profile_photo_reject_category?: string | null
          profile_photo_reject_reason?: string | null
          profile_photo_src?: string | null
          profile_photo_status?: Database["public"]["Enums"]["bd_member_photo_status"]
          profile_photo_storage_path?: string | null
          quote?: string | null
          recrop_reason?: string | null
          recrop_status?: string
          recropped_at?: string | null
          service_areas?: string | null
          services_text?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
          years_active?: string | null
          youtube?: string | null
          zip_code?: string | null
        }
        Update: {
          about_me?: string | null
          address1?: string | null
          address2?: string | null
          bd_member_id?: number
          bd_next_due_date?: string | null
          city?: string | null
          claim_status?: Database["public"]["Enums"]["bd_member_claim_status"]
          claimed_user_id?: string | null
          country_ln?: string | null
          created_at?: string
          credentials?: string | null
          email?: string
          experience?: string | null
          first_name?: string | null
          instagram?: string | null
          last_name?: string | null
          lat?: number | null
          legacy_billing_period?: string | null
          legacy_last_login_at?: string | null
          legacy_plan?: string | null
          legacy_signup_at?: string | null
          linkedin?: string | null
          lon?: number | null
          migration_canonical_stripe_customer_id?: string | null
          migration_charged_pence?: number | null
          migration_cohort_override?: string | null
          migration_cohort_reason?: string | null
          migration_error?: string | null
          migration_idempotency_key?: string | null
          migration_ran_at?: string | null
          migration_review_resolved?: boolean
          migration_status?: string | null
          migration_stripe_customer_id?: string | null
          migration_stripe_invoice_id?: string | null
          migration_stripe_schedule_id?: string | null
          migration_stripe_subscription_id?: string | null
          notes?: string | null
          phone_raw?: string | null
          profile_photo_reject_category?: string | null
          profile_photo_reject_reason?: string | null
          profile_photo_src?: string | null
          profile_photo_status?: Database["public"]["Enums"]["bd_member_photo_status"]
          profile_photo_storage_path?: string | null
          quote?: string | null
          recrop_reason?: string | null
          recrop_status?: string
          recropped_at?: string | null
          service_areas?: string | null
          services_text?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          website?: string | null
          years_active?: string | null
          youtube?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      bd_member_seed_pre_v7_snapshot: {
        Row: {
          bd_member_id: number | null
          email: string | null
          payload: Json
          snapshot_at: string
          snapshot_id: string
        }
        Insert: {
          bd_member_id?: number | null
          email?: string | null
          payload: Json
          snapshot_at?: string
          snapshot_id?: string
        }
        Update: {
          bd_member_id?: number | null
          email?: string | null
          payload?: Json
          snapshot_at?: string
          snapshot_id?: string
        }
        Relationships: []
      }
      bd_migration: {
        Row: {
          bd_member_id: string
          bd_plan: string | null
          bd_price_pence: number | null
          bd_renewal_date: string | null
          created_at: string
          email: string
          error_message: string | null
          full_name: string | null
          id: string
          processed_at: string | null
          rep_subscription_id: string | null
          rep_user_id: string | null
          status: Database["public"]["Enums"]["bd_migration_status"]
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          target_billing_period:
            | Database["public"]["Enums"]["billing_period"]
            | null
          target_price_id: string | null
          target_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          bd_member_id: string
          bd_plan?: string | null
          bd_price_pence?: number | null
          bd_renewal_date?: string | null
          created_at?: string
          email: string
          error_message?: string | null
          full_name?: string | null
          id?: string
          processed_at?: string | null
          rep_subscription_id?: string | null
          rep_user_id?: string | null
          status?: Database["public"]["Enums"]["bd_migration_status"]
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          target_billing_period?:
            | Database["public"]["Enums"]["billing_period"]
            | null
          target_price_id?: string | null
          target_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          bd_member_id?: string
          bd_plan?: string | null
          bd_price_pence?: number | null
          bd_renewal_date?: string | null
          created_at?: string
          email?: string
          error_message?: string | null
          full_name?: string | null
          id?: string
          processed_at?: string | null
          rep_subscription_id?: string | null
          rep_user_id?: string | null
          status?: Database["public"]["Enums"]["bd_migration_status"]
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          target_billing_period?:
            | Database["public"]["Enums"]["billing_period"]
            | null
          target_price_id?: string | null
          target_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bd_migration_rep_subscription_id_fkey"
            columns: ["rep_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      bd_migration_v7_run_log: {
        Row: {
          bd_member_id: number | null
          charged_pence: number | null
          cohort: string
          email: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          outcome: string
          ran_at: string
          ran_by: string | null
          stripe_customer_id: string | null
          stripe_invoice_id: string | null
          stripe_schedule_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          bd_member_id?: number | null
          charged_pence?: number | null
          cohort: string
          email?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          outcome: string
          ran_at?: string
          ran_by?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_schedule_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          bd_member_id?: number | null
          charged_pence?: number | null
          cohort?: string
          email?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          outcome?: string
          ran_at?: string
          ran_by?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_schedule_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      billing_setup_tokens: {
        Row: {
          bd_member_id: number | null
          consumed_at: string | null
          consumed_stripe_subscription_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          kind: string
          reminders_sent: Json
          target_renewal_at: string | null
          token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bd_member_id?: number | null
          consumed_at?: string | null
          consumed_stripe_subscription_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          kind: string
          reminders_sent?: Json
          target_renewal_at?: string | null
          token: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bd_member_id?: number | null
          consumed_at?: string | null
          consumed_stripe_subscription_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          kind?: string
          reminders_sent?: Json
          target_renewal_at?: string | null
          token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_setup_tokens_bd_member_id_fkey"
            columns: ["bd_member_id"]
            isOneToOne: false
            referencedRelation: "bd_member_seed"
            referencedColumns: ["bd_member_id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_pence: number
          client_email: string
          client_name: string | null
          client_user_id: string | null
          created_at: string
          currency: string
          dispute_status: string | null
          environment: string
          id: string
          metadata: Json
          paid_at: string | null
          professional_id: string
          refunded_amount_pence: number
          refunded_at: string | null
          service_id: string | null
          service_title: string | null
          status: Database["public"]["Enums"]["booking_status"]
          stripe_account_id: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_pence: number
          client_email: string
          client_name?: string | null
          client_user_id?: string | null
          created_at?: string
          currency?: string
          dispute_status?: string | null
          environment?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          professional_id: string
          refunded_amount_pence?: number
          refunded_at?: string | null
          service_id?: string | null
          service_title?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_account_id: string
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_pence?: number
          client_email?: string
          client_name?: string | null
          client_user_id?: string | null
          created_at?: string
          currency?: string
          dispute_status?: string | null
          environment?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          professional_id?: string
          refunded_amount_pence?: number
          refunded_at?: string | null
          service_id?: string | null
          service_title?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_account_id?: string
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_batches: {
        Row: {
          admin_note: string | null
          count: number
          created_at: string
          currency: string
          dispatched_at: string | null
          environment: string
          format: string
          id: string
          issued_at: string | null
          label_pdf_path: string | null
          paid_at: string | null
          postage_fee_pence_snapshot: number
          printed_at: string | null
          printed_by: string | null
          provider_id: string
          rm_order_identifier: string | null
          rm_order_reference: string | null
          rm_service_code: string | null
          ship_to_address: Json | null
          shipped_at: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          total_pence: number
          tracking_number: string | null
          tracking_url: string | null
          unit_price_pence: number
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          count?: number
          created_at?: string
          currency?: string
          dispatched_at?: string | null
          environment?: string
          format?: string
          id?: string
          issued_at?: string | null
          label_pdf_path?: string | null
          paid_at?: string | null
          postage_fee_pence_snapshot?: number
          printed_at?: string | null
          printed_by?: string | null
          provider_id: string
          rm_order_identifier?: string | null
          rm_order_reference?: string | null
          rm_service_code?: string | null
          ship_to_address?: Json | null
          shipped_at?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          total_pence?: number
          tracking_number?: string | null
          tracking_url?: string | null
          unit_price_pence: number
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          count?: number
          created_at?: string
          currency?: string
          dispatched_at?: string | null
          environment?: string
          format?: string
          id?: string
          issued_at?: string | null
          label_pdf_path?: string | null
          paid_at?: string | null
          postage_fee_pence_snapshot?: number
          printed_at?: string | null
          printed_by?: string | null
          provider_id?: string
          rm_order_identifier?: string | null
          rm_order_reference?: string | null
          rm_service_code?: string | null
          ship_to_address?: Json | null
          shipped_at?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          total_pence?: number
          tracking_number?: string | null
          tracking_url?: string | null
          unit_price_pence?: number
          updated_at?: string
        }
        Relationships: []
      }
      certificate_pricing: {
        Row: {
          currency: string
          default_rm_service_code: string
          id: boolean
          international_postage_fee_pence: number
          postage_fee_pence: number
          unit_price_pence: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          currency?: string
          default_rm_service_code?: string
          id?: boolean
          international_postage_fee_pence?: number
          postage_fee_pence?: number
          unit_price_pence?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          currency?: string
          default_rm_service_code?: string
          id?: boolean
          international_postage_fee_pence?: number
          postage_fee_pence?: number
          unit_price_pence?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      certificate_registrations: {
        Row: {
          batch_id: string | null
          certificate_number: string | null
          course_id: string
          course_kind: string
          course_level: number | null
          course_title: string
          created_at: string
          dispatched_at: string | null
          enrolled_at: string
          format: string | null
          id: string
          issued_at: string | null
          learner_id: string
          marked_passed_by: string | null
          paid_at: string | null
          passed_at: string | null
          pdf_path: string | null
          price_pence_at_issue: number | null
          provider_id: string
          reps_course_number: string | null
          revoked_at: string | null
          revoked_reason: string | null
          status: string
          unit_summary_pdf_path: string | null
          updated_at: string
          verification_token: string | null
        }
        Insert: {
          batch_id?: string | null
          certificate_number?: string | null
          course_id: string
          course_kind?: string
          course_level?: number | null
          course_title: string
          created_at?: string
          dispatched_at?: string | null
          enrolled_at?: string
          format?: string | null
          id?: string
          issued_at?: string | null
          learner_id: string
          marked_passed_by?: string | null
          paid_at?: string | null
          passed_at?: string | null
          pdf_path?: string | null
          price_pence_at_issue?: number | null
          provider_id: string
          reps_course_number?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: string
          unit_summary_pdf_path?: string | null
          updated_at?: string
          verification_token?: string | null
        }
        Update: {
          batch_id?: string | null
          certificate_number?: string | null
          course_id?: string
          course_kind?: string
          course_level?: number | null
          course_title?: string
          created_at?: string
          dispatched_at?: string | null
          enrolled_at?: string
          format?: string | null
          id?: string
          issued_at?: string | null
          learner_id?: string
          marked_passed_by?: string | null
          paid_at?: string | null
          passed_at?: string | null
          pdf_path?: string | null
          price_pence_at_issue?: number | null
          provider_id?: string
          reps_course_number?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: string
          unit_summary_pdf_path?: string | null
          updated_at?: string
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_registrations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "certificate_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_registrations_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          certificate_pdf_path: string
          created_at: string
          field_map: Json
          id: string
          is_default: boolean
          name: string
          notes: string | null
          slug: string
          unit_summary_pdf_path: string | null
          updated_at: string
        }
        Insert: {
          certificate_pdf_path: string
          created_at?: string
          field_map?: Json
          id?: string
          is_default?: boolean
          name: string
          notes?: string | null
          slug: string
          unit_summary_pdf_path?: string | null
          updated_at?: string
        }
        Update: {
          certificate_pdf_path?: string
          created_at?: string
          field_map?: Json
          id?: string
          is_default?: boolean
          name?: string
          notes?: string | null
          slug?: string
          unit_summary_pdf_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      certificate_upload_sessions: {
        Row: {
          created_at: string
          doc_path: string | null
          expires_at: string
          filename: string | null
          id: string
          professional_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_path?: string | null
          expires_at?: string
          filename?: string | null
          id?: string
          professional_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_path?: string | null
          expires_at?: string
          filename?: string | null
          id?: string
          professional_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_upload_sessions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_upload_sessions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      churn_lifecycle: {
        Row: {
          created_at: string
          entered_at: string
          id: string
          last_nudge_at: string | null
          metadata: Json
          nudge_count: number
          reason: string | null
          source_event: string | null
          stage: Database["public"]["Enums"]["churn_stage"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entered_at?: string
          id?: string
          last_nudge_at?: string | null
          metadata?: Json
          nudge_count?: number
          reason?: string | null
          source_event?: string | null
          stage?: Database["public"]["Enums"]["churn_stage"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entered_at?: string
          id?: string
          last_nudge_at?: string | null
          metadata?: Json
          nudge_count?: number
          reason?: string | null
          source_event?: string | null
          stage?: Database["public"]["Enums"]["churn_stage"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          auto_sent: boolean
          created_at: string
          email: string
          email_at_issue: string | null
          expires_at: string
          full_name: string | null
          id: string
          professional_id: string
          revoked_at: string | null
          roster_id: string | null
          status: Database["public"]["Enums"]["invite_status"]
          token_hash: string
          trigger_reason:
            | Database["public"]["Enums"]["invite_trigger_reason"]
            | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          auto_sent?: boolean
          created_at?: string
          email: string
          email_at_issue?: string | null
          expires_at?: string
          full_name?: string | null
          id?: string
          professional_id: string
          revoked_at?: string | null
          roster_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          token_hash: string
          trigger_reason?:
            | Database["public"]["Enums"]["invite_trigger_reason"]
            | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          auto_sent?: boolean
          created_at?: string
          email?: string
          email_at_issue?: string | null
          expires_at?: string
          full_name?: string | null
          id?: string
          professional_id?: string
          revoked_at?: string | null
          roster_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          token_hash?: string
          trigger_reason?:
            | Database["public"]["Enums"]["invite_trigger_reason"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "client_invites_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "client_roster"
            referencedColumns: ["id"]
          },
        ]
      }
      client_roster: {
        Row: {
          activated_at: string | null
          archived_at: string | null
          auth_user_id: string | null
          client_id: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          first_payment_at: string | null
          first_programme_at: string | null
          full_name: string | null
          id: string
          invite_id: string | null
          notes: string | null
          professional_id: string
          status: Database["public"]["Enums"]["roster_status"]
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          archived_at?: string | null
          auth_user_id?: string | null
          client_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          first_payment_at?: string | null
          first_programme_at?: string | null
          full_name?: string | null
          id?: string
          invite_id?: string | null
          notes?: string | null
          professional_id: string
          status?: Database["public"]["Enums"]["roster_status"]
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          archived_at?: string | null
          auth_user_id?: string | null
          client_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          first_payment_at?: string | null
          first_programme_at?: string | null
          full_name?: string | null
          id?: string
          invite_id?: string | null
          notes?: string | null
          professional_id?: string
          status?: Database["public"]["Enums"]["roster_status"]
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          date_of_birth: string | null
          height_cm: number | null
          id: string
          primary_goal: string | null
          sex: Database["public"]["Enums"]["sex_at_birth"] | null
          starting_weight_kg: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          height_cm?: number | null
          id: string
          primary_goal?: string | null
          sex?: Database["public"]["Enums"]["sex_at_birth"] | null
          starting_weight_kg?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          height_cm?: number | null
          id?: string
          primary_goal?: string | null
          sex?: Database["public"]["Enums"]["sex_at_birth"] | null
          starting_weight_kg?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      coach_client: {
        Row: {
          client_id: string
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          professional_id: string
          started_at: string
          status: Database["public"]["Enums"]["coach_client_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          professional_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["coach_client_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          professional_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["coach_client_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_client_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_client_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_client_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          charges_enabled: boolean
          connected_at: string
          country: string | null
          created_at: string
          default_currency: string | null
          details_submitted: boolean
          disconnected_at: string | null
          environment: string
          last_synced_at: string | null
          payouts_enabled: boolean
          professional_id: string
          requirements_due: Json
          stripe_account_id: string
          updated_at: string
        }
        Insert: {
          charges_enabled?: boolean
          connected_at?: string
          country?: string | null
          created_at?: string
          default_currency?: string | null
          details_submitted?: boolean
          disconnected_at?: string | null
          environment?: string
          last_synced_at?: string | null
          payouts_enabled?: boolean
          professional_id: string
          requirements_due?: Json
          stripe_account_id: string
          updated_at?: string
        }
        Update: {
          charges_enabled?: boolean
          connected_at?: string
          country?: string | null
          created_at?: string
          default_currency?: string | null
          details_submitted?: boolean
          disconnected_at?: string | null
          environment?: string
          last_synced_at?: string | null
          payouts_enabled?: boolean
          professional_id?: string
          requirements_due?: Json
          stripe_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connected_accounts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      course_accreditation_files: {
        Row: {
          course_id: string
          created_at: string
          file_kind: string
          file_name: string
          file_path: string
          id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          file_kind?: string
          file_name: string
          file_path: string
          id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          file_kind?: string
          file_name?: string
          file_path?: string
          id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_accreditation_files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          accredited_at: string | null
          accredited_by: string | null
          created_at: string
          delivery_mode:
            | Database["public"]["Enums"]["course_delivery_mode"]
            | null
          description_md: string | null
          duration_hours: number | null
          expires_at: string | null
          external_url: string | null
          id: string
          level: string | null
          organisation_id: string
          price_from: number | null
          reps_course_id: string | null
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accredited_at?: string | null
          accredited_by?: string | null
          created_at?: string
          delivery_mode?:
            | Database["public"]["Enums"]["course_delivery_mode"]
            | null
          description_md?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          external_url?: string | null
          id?: string
          level?: string | null
          organisation_id: string
          price_from?: number | null
          reps_course_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accredited_at?: string | null
          accredited_by?: string | null
          created_at?: string
          delivery_mode?:
            | Database["public"]["Enums"]["course_delivery_mode"]
            | null
          description_md?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          external_url?: string | null
          id?: string
          level?: string | null
          organisation_id?: string
          price_from?: number | null
          reps_course_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          action: string
          balance_after: number
          created_at: string
          delta: number
          id: string
          metadata: Json
          related_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          metadata?: Json
          related_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          metadata?: Json
          related_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          balance: number
          created_at: string
          last_refilled_at: string | null
          monthly_refill: number
          refill_ceiling: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          last_refilled_at?: string | null
          monthly_refill?: number
          refill_ceiling?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          last_refilled_at?: string | null
          monthly_refill?: number
          refill_ceiling?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cron_daily_runs: {
        Row: {
          job_name: string
          london_date: string
          ran_at: string
        }
        Insert: {
          job_name: string
          london_date: string
          ran_at?: string
        }
        Update: {
          job_name?: string
          london_date?: string
          ran_at?: string
        }
        Relationships: []
      }
      cron_secrets: {
        Row: {
          created_at: string
          name: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          name: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          name?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          amount_pence: number
          closed_at: string | null
          currency: string
          evidence_due_by: string | null
          funds_reinstated_pence: number
          funds_withdrawn_pence: number
          id: string
          lifecycle_stage: string
          opened_at: string
          payload: Json
          reason: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_customer_id: string | null
          stripe_dispute_id: string
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_pence?: number
          closed_at?: string | null
          currency?: string
          evidence_due_by?: string | null
          funds_reinstated_pence?: number
          funds_withdrawn_pence?: number
          id?: string
          lifecycle_stage?: string
          opened_at?: string
          payload?: Json
          reason?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_dispute_id: string
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_pence?: number
          closed_at?: string | null
          currency?: string
          evidence_due_by?: string | null
          funds_reinstated_pence?: number
          funds_withdrawn_pence?: number
          id?: string
          lifecycle_stage?: string
          opened_at?: string
          payload?: Json
          reason?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_dispute_id?: string
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          ai_band: Database["public"]["Enums"]["lead_band"] | null
          ai_predicted_pct: number | null
          ai_reasons: Json | null
          ai_recommended_action: string | null
          ai_score: number | null
          ai_summary: string | null
          ai_updated_at: string | null
          archived_at: string | null
          budget: string | null
          converted_client_id: string | null
          created_at: string
          estimated_value_pence: number | null
          follow_up_at: string | null
          frequency: string | null
          goals: string[]
          id: string
          ip_hash: string | null
          location: string | null
          message: string
          priority: Database["public"]["Enums"]["lead_priority"] | null
          professional_id: string
          read_at: string | null
          replied_at: string | null
          sender_email: string
          sender_name: string
          sender_phone: string | null
          sender_user_id: string | null
          service_id: string | null
          source: string
          stage: Database["public"]["Enums"]["lead_stage"]
          start_by: string | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          ai_band?: Database["public"]["Enums"]["lead_band"] | null
          ai_predicted_pct?: number | null
          ai_reasons?: Json | null
          ai_recommended_action?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          ai_updated_at?: string | null
          archived_at?: string | null
          budget?: string | null
          converted_client_id?: string | null
          created_at?: string
          estimated_value_pence?: number | null
          follow_up_at?: string | null
          frequency?: string | null
          goals?: string[]
          id?: string
          ip_hash?: string | null
          location?: string | null
          message: string
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          professional_id: string
          read_at?: string | null
          replied_at?: string | null
          sender_email: string
          sender_name: string
          sender_phone?: string | null
          sender_user_id?: string | null
          service_id?: string | null
          source?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          start_by?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          ai_band?: Database["public"]["Enums"]["lead_band"] | null
          ai_predicted_pct?: number | null
          ai_reasons?: Json | null
          ai_recommended_action?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          ai_updated_at?: string | null
          archived_at?: string | null
          budget?: string | null
          converted_client_id?: string | null
          created_at?: string
          estimated_value_pence?: number | null
          follow_up_at?: string | null
          frequency?: string | null
          goals?: string[]
          id?: string
          ip_hash?: string | null
          location?: string | null
          message?: string
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          professional_id?: string
          read_at?: string | null
          replied_at?: string | null
          sender_email?: string
          sender_name?: string
          sender_phone?: string | null
          sender_user_id?: string | null
          service_id?: string | null
          source?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          start_by?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "enquiries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          audience: Json
          created_at: string
          description: string | null
          enabled: boolean
          flag_key: string
          updated_at: string
        }
        Insert: {
          audience?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key: string
          updated_at?: string
        }
        Update: {
          audience?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      gyms: {
        Row: {
          area: string | null
          business_status: string | null
          chain_name: string | null
          chain_slug: string | null
          city: string | null
          claim_status: string
          claimed_by: string | null
          created_at: string
          created_by: string | null
          facilities: string[]
          google_place_id: string | null
          hero_url: string | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          postcode: string | null
          slug: string
          source: string
          status: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          business_status?: string | null
          chain_name?: string | null
          chain_slug?: string | null
          city?: string | null
          claim_status?: string
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          facilities?: string[]
          google_place_id?: string | null
          hero_url?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          postcode?: string | null
          slug: string
          source?: string
          status?: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          business_status?: string | null
          chain_name?: string | null
          chain_slug?: string | null
          city?: string | null
          claim_status?: string
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          facilities?: string[]
          google_place_id?: string | null
          hero_url?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          postcode?: string | null
          slug?: string
          source?: string
          status?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      help_article_feedback: {
        Row: {
          anon_id: string | null
          article_slug: string
          created_at: string
          id: string
          user_agent: string | null
          user_id: string | null
          vote: number
        }
        Insert: {
          anon_id?: string | null
          article_slug: string
          created_at?: string
          id?: string
          user_agent?: string | null
          user_id?: string | null
          vote: number
        }
        Update: {
          anon_id?: string | null
          article_slug?: string
          created_at?: string
          id?: string
          user_agent?: string | null
          user_id?: string | null
          vote?: number
        }
        Relationships: []
      }
      identity_documents: {
        Row: {
          admin_note: string | null
          created_at: string
          dob_on_doc: string | null
          doc_country: string | null
          doc_expiry: string | null
          doc_path_back: string | null
          doc_path_front: string | null
          doc_type: string | null
          environment: string
          file_sha256: string | null
          id: string
          liveness_passed: boolean | null
          name_on_doc: string | null
          professional_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_match_score: number | null
          selfie_path: string | null
          status: string
          stripe_reason: string | null
          stripe_status: string | null
          stripe_vs_id: string | null
          stripe_vs_url: string | null
          updated_at: string
          vendor: string
          veriff_decision: Json | null
          veriff_reason: string | null
          veriff_session_id: string | null
          veriff_session_url: string | null
          veriff_status: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          dob_on_doc?: string | null
          doc_country?: string | null
          doc_expiry?: string | null
          doc_path_back?: string | null
          doc_path_front?: string | null
          doc_type?: string | null
          environment?: string
          file_sha256?: string | null
          id?: string
          liveness_passed?: boolean | null
          name_on_doc?: string | null
          professional_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_match_score?: number | null
          selfie_path?: string | null
          status?: string
          stripe_reason?: string | null
          stripe_status?: string | null
          stripe_vs_id?: string | null
          stripe_vs_url?: string | null
          updated_at?: string
          vendor?: string
          veriff_decision?: Json | null
          veriff_reason?: string | null
          veriff_session_id?: string | null
          veriff_session_url?: string | null
          veriff_status?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          dob_on_doc?: string | null
          doc_country?: string | null
          doc_expiry?: string | null
          doc_path_back?: string | null
          doc_path_front?: string | null
          doc_type?: string | null
          environment?: string
          file_sha256?: string | null
          id?: string
          liveness_passed?: boolean | null
          name_on_doc?: string | null
          professional_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_match_score?: number | null
          selfie_path?: string | null
          status?: string
          stripe_reason?: string | null
          stripe_status?: string | null
          stripe_vs_id?: string | null
          stripe_vs_url?: string | null
          updated_at?: string
          vendor?: string
          veriff_decision?: Json | null
          veriff_reason?: string | null
          veriff_session_id?: string | null
          veriff_session_url?: string | null
          veriff_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      identity_name_changes: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_full_name: string | null
          old_full_name: string | null
          reason: string | null
          source: string
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_full_name?: string | null
          old_full_name?: string | null
          reason?: string | null
          source?: string
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_full_name?: string | null
          old_full_name?: string | null
          reason?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_policies: {
        Row: {
          admin_note: string | null
          ai_checked_at: string | null
          ai_extraction: Json | null
          cover_amount_gbp: number | null
          created_at: string
          doc_path: string
          expiry_date: string
          file_sha256: string | null
          id: string
          insured_name: string | null
          name_match: boolean | null
          policy_number: string | null
          professional_id: string
          provider: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string | null
          status: string
          trust_signals: Json | null
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          ai_checked_at?: string | null
          ai_extraction?: Json | null
          cover_amount_gbp?: number | null
          created_at?: string
          doc_path: string
          expiry_date: string
          file_sha256?: string | null
          id?: string
          insured_name?: string | null
          name_match?: boolean | null
          policy_number?: string | null
          professional_id: string
          provider: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          trust_signals?: Json | null
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          ai_checked_at?: string | null
          ai_extraction?: Json | null
          cover_amount_gbp?: number | null
          created_at?: string
          doc_path?: string
          expiry_date?: string
          file_sha256?: string | null
          id?: string
          insured_name?: string | null
          name_match?: boolean | null
          policy_number?: string | null
          professional_id?: string
          provider?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          trust_signals?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      insurance_upload_sessions: {
        Row: {
          created_at: string
          doc_path: string | null
          expires_at: string
          filename: string | null
          id: string
          professional_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_path?: string | null
          expires_at?: string
          filename?: string | null
          id?: string
          professional_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_path?: string | null
          expires_at?: string
          filename?: string | null
          id?: string
          professional_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_upload_sessions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_upload_sessions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      ip_geo_cache: {
        Row: {
          city: string | null
          country_code: string | null
          latitude: number | null
          longitude: number | null
          looked_up_at: string
          region: string | null
          source: string
          subnet: string
          timezone: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          latitude?: number | null
          longitude?: number | null
          looked_up_at?: string
          region?: string | null
          source?: string
          subnet: string
          timezone?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          latitude?: number | null
          longitude?: number | null
          looked_up_at?: string
          region?: string | null
          source?: string
          subnet?: string
          timezone?: string | null
        }
        Relationships: []
      }
      ip_geolocation_cache: {
        Row: {
          asn: string | null
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          expires_at: string
          first_seen_at: string
          id: string
          ip_hash: string
          ip_prefix_hash: string | null
          last_seen_at: string
          latitude: number | null
          longitude: number | null
          lookup_status: string
          org: string | null
          postal_code: string | null
          provider: string
          raw_response_jsonb: Json | null
          region: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          asn?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          expires_at?: string
          first_seen_at?: string
          id?: string
          ip_hash: string
          ip_prefix_hash?: string | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          lookup_status?: string
          org?: string | null
          postal_code?: string | null
          provider?: string
          raw_response_jsonb?: Json | null
          region?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          asn?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          expires_at?: string
          first_seen_at?: string
          id?: string
          ip_hash?: string
          ip_prefix_hash?: string | null
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          lookup_status?: string
          org?: string | null
          postal_code?: string | null
          provider?: string
          raw_response_jsonb?: Json | null
          region?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      launch_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      lead_activity: {
        Row: {
          created_at: string
          created_by: string | null
          enquiry_id: string
          id: string
          payload: Json
          professional_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enquiry_id: string
          id?: string
          payload?: Json
          professional_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enquiry_id?: string
          id?: string
          payload?: Json
          professional_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activity_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activity_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      lead_proposals: {
        Row: {
          body: Json
          created_at: string
          enquiry_id: string
          id: string
          professional_id: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          body?: Json
          created_at?: string
          enquiry_id: string
          id?: string
          professional_id: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          body?: Json
          created_at?: string
          enquiry_id?: string
          id?: string
          professional_id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_proposals_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      learners: {
        Row: {
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          dob: string | null
          email: string
          full_name: string
          id: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dob?: string | null
          email: string
          full_name: string
          id?: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dob?: string | null
          email?: string
          full_name?: string
          id?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      legacy_redirects: {
        Row: {
          destination_path: string
          imported_at: string
          kind: string
          resolved_to_slug: string | null
          source_path: string
          terminal_path: string | null
          updated_at: string
        }
        Insert: {
          destination_path: string
          imported_at?: string
          kind?: string
          resolved_to_slug?: string | null
          source_path: string
          terminal_path?: string | null
          updated_at?: string
        }
        Update: {
          destination_path?: string
          imported_at?: string
          kind?: string
          resolved_to_slug?: string | null
          source_path?: string
          terminal_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      legacy_stripe_link: {
        Row: {
          access_expires_at: string | null
          bd_member_id: number
          converted_at: string | null
          converted_subscription_id: string | null
          created_at: string
          current_price_id: string | null
          eligible_for_legacy_price: boolean
          email: string
          is_lifetime: boolean
          last_attempt_at: string | null
          last_paid_amount_pence: number | null
          last_paid_at: string | null
          legacy_kind: string
          link_status: string
          migration_kind: string | null
          migration_status: string
          next_due_at: string | null
          notes: string | null
          stripe_customer_id: string | null
          stripe_schedule_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          access_expires_at?: string | null
          bd_member_id: number
          converted_at?: string | null
          converted_subscription_id?: string | null
          created_at?: string
          current_price_id?: string | null
          eligible_for_legacy_price?: boolean
          email: string
          is_lifetime?: boolean
          last_attempt_at?: string | null
          last_paid_amount_pence?: number | null
          last_paid_at?: string | null
          legacy_kind?: string
          link_status?: string
          migration_kind?: string | null
          migration_status?: string
          next_due_at?: string | null
          notes?: string | null
          stripe_customer_id?: string | null
          stripe_schedule_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          access_expires_at?: string | null
          bd_member_id?: number
          converted_at?: string | null
          converted_subscription_id?: string | null
          created_at?: string
          current_price_id?: string | null
          eligible_for_legacy_price?: boolean
          email?: string
          is_lifetime?: boolean
          last_attempt_at?: string | null
          last_paid_amount_pence?: number | null
          last_paid_at?: string | null
          legacy_kind?: string
          link_status?: string
          migration_kind?: string | null
          migration_status?: string
          next_due_at?: string | null
          notes?: string | null
          stripe_customer_id?: string | null
          stripe_schedule_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_stripe_link_bd_member_id_fkey"
            columns: ["bd_member_id"]
            isOneToOne: true
            referencedRelation: "bd_member_seed"
            referencedColumns: ["bd_member_id"]
          },
        ]
      }
      legacy_stripe_payments: {
        Row: {
          amount_pence: number
          card_brand: string | null
          card_last4: string | null
          charge_id: string
          created_at: string
          currency: string
          description: string | null
          email: string
          import_batch_id: string | null
          imported_at: string
          paid_at: string
          refunded_amount_pence: number
          refunded_at: string | null
          status: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_pence: number
          card_brand?: string | null
          card_last4?: string | null
          charge_id: string
          created_at?: string
          currency?: string
          description?: string | null
          email: string
          import_batch_id?: string | null
          imported_at?: string
          paid_at: string
          refunded_amount_pence?: number
          refunded_at?: string | null
          status: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_pence?: number
          card_brand?: string | null
          card_last4?: string | null
          charge_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          email?: string
          import_batch_id?: string | null
          imported_at?: string
          paid_at?: string
          refunded_amount_pence?: number
          refunded_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mailing_list_contacts: {
        Row: {
          city: string | null
          created_at: string
          deleted_at: string
          deletion_notes: string | null
          deletion_reason: Database["public"]["Enums"]["mailing_list_deletion_reason"]
          email: string
          former_user_id: string | null
          full_name: string | null
          id: string
          last_tier: string | null
          marketing_opt_in: boolean
          profession: string | null
          source: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          deleted_at?: string
          deletion_notes?: string | null
          deletion_reason: Database["public"]["Enums"]["mailing_list_deletion_reason"]
          email: string
          former_user_id?: string | null
          full_name?: string | null
          id?: string
          last_tier?: string | null
          marketing_opt_in?: boolean
          profession?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          deleted_at?: string
          deletion_notes?: string | null
          deletion_reason?: Database["public"]["Enums"]["mailing_list_deletion_reason"]
          email?: string
          former_user_id?: string | null
          full_name?: string | null
          id?: string
          last_tier?: string | null
          marketing_opt_in?: boolean
          profession?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_session_events: {
        Row: {
          browser: string | null
          city: string | null
          country_code: string | null
          created_at: string
          device: string | null
          duration_ms: number | null
          geo_source: string | null
          id: string
          ip: string | null
          ip_hash: string | null
          latitude: number | null
          longitude: number | null
          os: string | null
          path: string
          referrer: string | null
          region: string | null
          session_id: string | null
          timezone: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          duration_ms?: number | null
          geo_source?: string | null
          id?: string
          ip?: string | null
          ip_hash?: string | null
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          path: string
          referrer?: string | null
          region?: string | null
          session_id?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          duration_ms?: number | null
          geo_source?: string | null
          id?: string
          ip?: string | null
          ip_hash?: string | null
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          path?: string
          referrer?: string | null
          region?: string | null
          session_id?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      metrics_daily_public_analytics: {
        Row: {
          checkout_starts: number
          countries: Json
          created_at: string
          devices: Json
          directory_searches: number
          enquiries_created: number
          enquiries_started: number
          metric_date: string
          public_page_views: number
          public_profile_views: number
          public_unique_sessions: number
          result_clicks: number
          searches_no_results: number
          signup_completes: number
          signup_starts: number
          top_landing_pages: Json
          top_no_result_searches: Json
          top_pages: Json
          top_profiles: Json
          top_referrers: Json
          top_searches: Json
          updated_at: string
        }
        Insert: {
          checkout_starts?: number
          countries?: Json
          created_at?: string
          devices?: Json
          directory_searches?: number
          enquiries_created?: number
          enquiries_started?: number
          metric_date: string
          public_page_views?: number
          public_profile_views?: number
          public_unique_sessions?: number
          result_clicks?: number
          searches_no_results?: number
          signup_completes?: number
          signup_starts?: number
          top_landing_pages?: Json
          top_no_result_searches?: Json
          top_pages?: Json
          top_profiles?: Json
          top_referrers?: Json
          top_searches?: Json
          updated_at?: string
        }
        Update: {
          checkout_starts?: number
          countries?: Json
          created_at?: string
          devices?: Json
          directory_searches?: number
          enquiries_created?: number
          enquiries_started?: number
          metric_date?: string
          public_page_views?: number
          public_profile_views?: number
          public_unique_sessions?: number
          result_clicks?: number
          searches_no_results?: number
          signup_completes?: number
          signup_starts?: number
          top_landing_pages?: Json
          top_no_result_searches?: Json
          top_pages?: Json
          top_profiles?: Json
          top_referrers?: Json
          top_searches?: Json
          updated_at?: string
        }
        Relationships: []
      }
      metrics_monthly_activity: {
        Row: {
          computed_at: string
          countries: Json | null
          devices: Json | null
          disputes: number
          enquiries: number
          member_page_views: number
          month: string
          payments: number
          reviews: number
          sign_ins: number
          signed_in_users: number
          support_messages: number
          unique_members_seen: number
        }
        Insert: {
          computed_at?: string
          countries?: Json | null
          devices?: Json | null
          disputes?: number
          enquiries?: number
          member_page_views?: number
          month: string
          payments?: number
          reviews?: number
          sign_ins?: number
          signed_in_users?: number
          support_messages?: number
          unique_members_seen?: number
        }
        Update: {
          computed_at?: string
          countries?: Json | null
          devices?: Json | null
          disputes?: number
          enquiries?: number
          member_page_views?: number
          month?: string
          payments?: number
          reviews?: number
          sign_ins?: number
          signed_in_users?: number
          support_messages?: number
          unique_members_seen?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirm_token: string
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          ip: unknown
          source: string
          source_url: string | null
          status: string
          unsubscribed_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          ip?: unknown
          source?: string
          source_url?: string | null
          status?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          ip?: unknown
          source?: string
          source_url?: string | null
          status?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          marketing_opt_in: boolean
          new_enquiry_email: boolean
          updated_at: string
          user_id: string
          weekly_enquiry_digest: boolean
        }
        Insert: {
          created_at?: string
          marketing_opt_in?: boolean
          new_enquiry_email?: boolean
          updated_at?: string
          user_id: string
          weekly_enquiry_digest?: boolean
        }
        Update: {
          created_at?: string
          marketing_opt_in?: boolean
          new_enquiry_email?: boolean
          updated_at?: string
          user_id?: string
          weekly_enquiry_digest?: boolean
        }
        Relationships: []
      }
      ofqual_cache: {
        Row: {
          fetched_at: string
          found: boolean
          qualification_number: string
          record: Json | null
        }
        Insert: {
          fetched_at?: string
          found?: boolean
          qualification_number: string
          record?: Json | null
        }
        Update: {
          fetched_at?: string
          found?: boolean
          qualification_number?: string
          record?: Json | null
        }
        Relationships: []
      }
      onboarding_nudges: {
        Row: {
          message_id: string | null
          sent_at: string
          stage: string
          step: number
          user_id: string
        }
        Insert: {
          message_id?: string | null
          sent_at?: string
          stage: string
          step: number
          user_id: string
        }
        Update: {
          message_id?: string | null
          sent_at?: string
          stage?: string
          step?: number
          user_id?: string
        }
        Relationships: []
      }
      ops_alerts: {
        Row: {
          ack_at: string | null
          ack_by: string | null
          context: Json
          email_dispatched_at: string | null
          id: string
          kind: string
          muted_until: string | null
          notes: string | null
          opened_at: string
          resolved_at: string | null
          severity: string
        }
        Insert: {
          ack_at?: string | null
          ack_by?: string | null
          context?: Json
          email_dispatched_at?: string | null
          id?: string
          kind: string
          muted_until?: string | null
          notes?: string | null
          opened_at?: string
          resolved_at?: string | null
          severity?: string
        }
        Update: {
          ack_at?: string | null
          ack_by?: string | null
          context?: Json
          email_dispatched_at?: string | null
          id?: string
          kind?: string
          muted_until?: string | null
          notes?: string | null
          opened_at?: string
          resolved_at?: string | null
          severity?: string
        }
        Relationships: []
      }
      outbound_campaign_recipients: {
        Row: {
          bounced_at: string | null
          campaign_id: string
          click_count: number
          complained_at: string | null
          created_at: string
          delivered_at: string | null
          email: string
          error_message: string | null
          first_clicked_at: string | null
          id: string
          last_clicked_at: string | null
          last_clicked_url: string | null
          mailgun_message_id: string | null
          name: string | null
          open_count: number
          opened_at: string | null
          replied_at: string | null
          reply_ticket_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_recipient_status"]
          unsubscribed_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          campaign_id: string
          click_count?: number
          complained_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email: string
          error_message?: string | null
          first_clicked_at?: string | null
          id?: string
          last_clicked_at?: string | null
          last_clicked_url?: string | null
          mailgun_message_id?: string | null
          name?: string | null
          open_count?: number
          opened_at?: string | null
          replied_at?: string | null
          reply_ticket_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_recipient_status"]
          unsubscribed_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string
          click_count?: number
          complained_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email?: string
          error_message?: string | null
          first_clicked_at?: string | null
          id?: string
          last_clicked_at?: string | null
          last_clicked_url?: string | null
          mailgun_message_id?: string | null
          name?: string | null
          open_count?: number
          opened_at?: string | null
          replied_at?: string | null
          reply_ticket_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_recipient_status"]
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outbound_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_campaign_recipients_reply_ticket_id_fkey"
            columns: ["reply_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_campaigns: {
        Row: {
          attachments: Json
          body_html: string | null
          body_text: string
          bounced_count: number
          clicked_count: number
          complained_count: number
          created_at: string
          created_by: string | null
          delivered_count: number
          direct_recipients: Json
          failed_count: number
          format: string
          id: string
          inbox: string
          last_error: string | null
          mode: string | null
          opened_count: number
          prospect_tags: string[]
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          status: string
          subject: string
          tiers: string[]
          total_recipients: number
          unsubscribed_count: number
        }
        Insert: {
          attachments?: Json
          body_html?: string | null
          body_text: string
          bounced_count?: number
          clicked_count?: number
          complained_count?: number
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          direct_recipients?: Json
          failed_count?: number
          format?: string
          id?: string
          inbox: string
          last_error?: string | null
          mode?: string | null
          opened_count?: number
          prospect_tags?: string[]
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject: string
          tiers?: string[]
          total_recipients?: number
          unsubscribed_count?: number
        }
        Update: {
          attachments?: Json
          body_html?: string | null
          body_text?: string
          bounced_count?: number
          clicked_count?: number
          complained_count?: number
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          direct_recipients?: Json
          failed_count?: number
          format?: string
          id?: string
          inbox?: string
          last_error?: string | null
          mode?: string | null
          opened_count?: number
          prospect_tags?: string[]
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          tiers?: string[]
          total_recipients?: number
          unsubscribed_count?: number
        }
        Relationships: []
      }
      page_view_events: {
        Row: {
          anon_id: string
          browser: string | null
          city: string | null
          country_code: string | null
          created_at: string
          device: string | null
          id: string
          ip_hash: string | null
          is_admin_view: boolean
          os: string | null
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          anon_id: string
          browser?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_hash?: string | null
          is_admin_view?: boolean
          os?: string | null
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          anon_id?: string
          browser?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_hash?: string | null
          is_admin_view?: boolean
          os?: string | null
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_view_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          dead_lettered_at: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          retry_count: number
          stripe_customer_id: string | null
          stripe_event_id: string | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dead_lettered_at?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          retry_count?: number
          stripe_customer_id?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dead_lettered_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          retry_count?: number
          stripe_customer_id?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pending_signups: {
        Row: {
          consumed_at: string | null
          created_at: string
          email: string
          environment: string
          full_name: string
          id: string
          password_ciphertext: string
          period: string
          stripe_customer_id: string | null
          stripe_session_id: string | null
          tier: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          email: string
          environment: string
          full_name: string
          id?: string
          password_ciphertext: string
          period: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          tier: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          email?: string
          environment?: string
          full_name?: string
          id?: string
          password_ciphertext?: string
          period?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          tier?: string
        }
        Relationships: []
      }
      pro_titles: {
        Row: {
          admin_note: string | null
          created_at: string
          granted_at: string
          granted_by: string
          id: string
          is_primary: boolean
          professional_id: string
          source_submission_id: string | null
          title_slug: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          granted_at?: string
          granted_by?: string
          id?: string
          is_primary?: boolean
          professional_id: string
          source_submission_id?: string | null
          title_slug: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          granted_at?: string
          granted_by?: string
          id?: string
          is_primary?: boolean
          professional_id?: string
          source_submission_id?: string | null
          title_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_titles_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_titles_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "pro_titles_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "v_qualifications_review_queue"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "pro_titles_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "verification_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_gyms: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          position: number
          professional_id: string
          verified_by_gym: boolean
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          position?: number
          professional_id: string
          verified_by_gym?: boolean
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          position?: number
          professional_id?: string
          verified_by_gym?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "professional_gyms_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_gyms_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_gyms_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      professional_locations: {
        Row: {
          country_code: string
          created_at: string
          district: string | null
          id: string
          is_primary: boolean
          is_public: boolean
          label: string | null
          latitude: number | null
          longitude: number | null
          postcode: string | null
          postcode_outward: string | null
          professional_id: string
          region: string | null
          service_radius_miles: number | null
          town: string | null
          type: string
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          district?: string | null
          id?: string
          is_primary?: boolean
          is_public?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          postcode?: string | null
          postcode_outward?: string | null
          professional_id: string
          region?: string | null
          service_radius_miles?: number | null
          town?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          district?: string | null
          id?: string
          is_primary?: boolean
          is_public?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          postcode?: string | null
          postcode_outward?: string | null
          professional_id?: string
          region?: string | null
          service_radius_miles?: number | null
          town?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_locations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_locations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      professional_photos: {
        Row: {
          byte_size: number | null
          created_at: string
          height: number | null
          id: string
          mime_type: string | null
          professional_id: string
          sort_order: number
          storage_path: string
          updated_at: string
          width: number | null
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          professional_id: string
          sort_order?: number
          storage_path: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          professional_id?: string
          sort_order?: number
          storage_path?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_photos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_photos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      professionals: {
        Row: {
          account_type: string
          address: string | null
          awarding_bodies: string[]
          bd_seed_thin: boolean
          bio: string | null
          cert_uploaded_at: string | null
          city: string | null
          company_number: string | null
          company_registration: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          dbs_valid_until: string | null
          from_price_pennies: number | null
          headline: string | null
          hourly_rate_pence: number | null
          id: string
          identity_status: string
          identity_verified_at: string | null
          identity_verified_dob: string | null
          identity_verified_name: string | null
          in_person_available: boolean
          insurance_valid_until: string | null
          is_demo: boolean
          is_published: boolean
          languages: string[]
          legal_entity_name: string | null
          locale: string
          member_since: string | null
          online_available: boolean
          price_currency: string
          primary_profession: string | null
          primary_title_slug: string | null
          quality_score: number
          reps_level: Database["public"]["Enums"]["reps_level"] | null
          reps_member_id: string | null
          secondary_title_slug: string | null
          slug: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_tiktok: string | null
          social_x: string | null
          social_youtube: string | null
          specialisms: string[]
          staff_count: number | null
          stripe_identity_session_id: string | null
          suspended_at: string | null
          suspension_reason: string | null
          timezone: string
          trains_at_clients_home: boolean
          trains_at_home_studio: boolean
          unpublished_at: string | null
          unpublished_reason: string | null
          updated_at: string
          value_prop: string | null
          verification: Database["public"]["Enums"]["verification_status"]
          verification_grace_until: string | null
          verification_status: Database["public"]["Enums"]["verification_state"]
          website: string | null
          website_url: string | null
          year_established: number | null
          years_experience: number | null
        }
        Insert: {
          account_type?: string
          address?: string | null
          awarding_bodies?: string[]
          bd_seed_thin?: boolean
          bio?: string | null
          cert_uploaded_at?: string | null
          city?: string | null
          company_number?: string | null
          company_registration?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          dbs_valid_until?: string | null
          from_price_pennies?: number | null
          headline?: string | null
          hourly_rate_pence?: number | null
          id: string
          identity_status?: string
          identity_verified_at?: string | null
          identity_verified_dob?: string | null
          identity_verified_name?: string | null
          in_person_available?: boolean
          insurance_valid_until?: string | null
          is_demo?: boolean
          is_published?: boolean
          languages?: string[]
          legal_entity_name?: string | null
          locale?: string
          member_since?: string | null
          online_available?: boolean
          price_currency?: string
          primary_profession?: string | null
          primary_title_slug?: string | null
          quality_score?: number
          reps_level?: Database["public"]["Enums"]["reps_level"] | null
          reps_member_id?: string | null
          secondary_title_slug?: string | null
          slug?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_x?: string | null
          social_youtube?: string | null
          specialisms?: string[]
          staff_count?: number | null
          stripe_identity_session_id?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          timezone?: string
          trains_at_clients_home?: boolean
          trains_at_home_studio?: boolean
          unpublished_at?: string | null
          unpublished_reason?: string | null
          updated_at?: string
          value_prop?: string | null
          verification?: Database["public"]["Enums"]["verification_status"]
          verification_grace_until?: string | null
          verification_status?: Database["public"]["Enums"]["verification_state"]
          website?: string | null
          website_url?: string | null
          year_established?: number | null
          years_experience?: number | null
        }
        Update: {
          account_type?: string
          address?: string | null
          awarding_bodies?: string[]
          bd_seed_thin?: boolean
          bio?: string | null
          cert_uploaded_at?: string | null
          city?: string | null
          company_number?: string | null
          company_registration?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          dbs_valid_until?: string | null
          from_price_pennies?: number | null
          headline?: string | null
          hourly_rate_pence?: number | null
          id?: string
          identity_status?: string
          identity_verified_at?: string | null
          identity_verified_dob?: string | null
          identity_verified_name?: string | null
          in_person_available?: boolean
          insurance_valid_until?: string | null
          is_demo?: boolean
          is_published?: boolean
          languages?: string[]
          legal_entity_name?: string | null
          locale?: string
          member_since?: string | null
          online_available?: boolean
          price_currency?: string
          primary_profession?: string | null
          primary_title_slug?: string | null
          quality_score?: number
          reps_level?: Database["public"]["Enums"]["reps_level"] | null
          reps_member_id?: string | null
          secondary_title_slug?: string | null
          slug?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_x?: string | null
          social_youtube?: string | null
          specialisms?: string[]
          staff_count?: number | null
          stripe_identity_session_id?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          timezone?: string
          trains_at_clients_home?: boolean
          trains_at_home_studio?: boolean
          unpublished_at?: string | null
          unpublished_reason?: string | null
          updated_at?: string
          value_prop?: string | null
          verification?: Database["public"]["Enums"]["verification_status"]
          verification_grace_until?: string | null
          verification_status?: Database["public"]["Enums"]["verification_state"]
          website?: string | null
          website_url?: string | null
          year_established?: number | null
          years_experience?: number | null
        }
        Relationships: []
      }
      profile_view_events: {
        Row: {
          created_at: string
          id: number
          professional_id: string
          referrer_host: string | null
          source: string | null
          user_agent: string | null
          viewer_ip_hash: string | null
          viewer_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          professional_id: string
          referrer_host?: string | null
          source?: string | null
          user_agent?: string | null
          viewer_ip_hash?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          professional_id?: string
          referrer_host?: string | null
          source?: string | null
          user_agent?: string | null
          viewer_ip_hash?: string | null
          viewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_view_events_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_view_events_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_is_ai_generated: boolean
          avatar_qa_source: string | null
          avatar_qa_status: string
          avatar_url: string | null
          certificate_logo_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_is_ai_generated?: boolean
          avatar_qa_source?: string | null
          avatar_qa_status?: string
          avatar_url?: string | null
          certificate_logo_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_is_ai_generated?: boolean
          avatar_qa_source?: string | null
          avatar_qa_status?: string
          avatar_url?: string | null
          certificate_logo_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      programmes_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          note: string | null
          professional_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          note?: string | null
          professional_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          note?: string | null
          professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programmes_waitlist_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmes_waitlist_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      prospect_contacts: {
        Row: {
          converted_user_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          imported_at: string
          imported_by: string | null
          list_tag: string | null
          source_note: string | null
          status: Database["public"]["Enums"]["prospect_status"]
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          converted_user_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          list_tag?: string | null
          source_note?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          converted_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          list_tag?: string | null
          source_note?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_change_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          current_value: Json | null
          field_group: string
          field_key: string
          id: string
          proposed_value: Json | null
          provider_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["provider_change_status"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          current_value?: Json | null
          field_group: string
          field_key: string
          id?: string
          proposed_value?: Json | null
          provider_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["provider_change_status"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          current_value?: Json | null
          field_group?: string
          field_key?: string
          id?: string
          proposed_value?: Json | null
          provider_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["provider_change_status"]
          updated_at?: string
        }
        Relationships: []
      }
      provider_domain_verifications: {
        Row: {
          admin_decision_reason: string | null
          admin_notes: string | null
          admin_reviewed_at: string | null
          admin_reviewer_id: string | null
          confirmation_expires_at: string | null
          confirmation_token_hash: string | null
          created_at: string
          domain: string | null
          email: string | null
          email_confirmed_at: string | null
          email_sent_at: string | null
          id: string
          last_resend_at: string | null
          professional_id: string
          resend_count_today: number
          status: string
          updated_at: string
        }
        Insert: {
          admin_decision_reason?: string | null
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          admin_reviewer_id?: string | null
          confirmation_expires_at?: string | null
          confirmation_token_hash?: string | null
          created_at?: string
          domain?: string | null
          email?: string | null
          email_confirmed_at?: string | null
          email_sent_at?: string | null
          id?: string
          last_resend_at?: string | null
          professional_id: string
          resend_count_today?: number
          status?: string
          updated_at?: string
        }
        Update: {
          admin_decision_reason?: string | null
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          admin_reviewer_id?: string | null
          confirmation_expires_at?: string | null
          confirmation_token_hash?: string | null
          created_at?: string
          domain?: string | null
          email?: string | null
          email_confirmed_at?: string | null
          email_sent_at?: string | null
          id?: string
          last_resend_at?: string | null
          professional_id?: string
          resend_count_today?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_domain_verifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_domain_verifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      provider_name_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          requested_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          requested_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          requested_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_regulated_permissions: {
        Row: {
          admin_note: string | null
          ai_cross_check: Json | null
          ai_draft: Json | null
          ai_drafted_at: string | null
          ai_extraction: Json | null
          ai_red_flags: string[]
          ai_verdict: string | null
          awarding_body_reference: string | null
          created_at: string
          evidence_doc_paths: string[]
          evidence_expires_at: string | null
          evidence_issued_at: string | null
          evidence_type: string
          id: string
          ofqual_found: boolean
          ofqual_number: string | null
          ofqual_snapshot: Json | null
          provider_id: string
          qualification_id: string | null
          reps_qualification_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          spec_guided_learning_hours: number | null
          spec_how_youll_study: string | null
          spec_how_youre_assessed: string | null
          spec_learning_outcomes: Json | null
          spec_prerequisites: string | null
          spec_published_at: string | null
          spec_total_qualification_time: number | null
          spec_who_for: string | null
          status: string
          submission_group_id: string | null
          updated_at: string
          withdrawn_at: string | null
          withdrawn_reason: string | null
        }
        Insert: {
          admin_note?: string | null
          ai_cross_check?: Json | null
          ai_draft?: Json | null
          ai_drafted_at?: string | null
          ai_extraction?: Json | null
          ai_red_flags?: string[]
          ai_verdict?: string | null
          awarding_body_reference?: string | null
          created_at?: string
          evidence_doc_paths?: string[]
          evidence_expires_at?: string | null
          evidence_issued_at?: string | null
          evidence_type: string
          id?: string
          ofqual_found?: boolean
          ofqual_number?: string | null
          ofqual_snapshot?: Json | null
          provider_id: string
          qualification_id?: string | null
          reps_qualification_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spec_guided_learning_hours?: number | null
          spec_how_youll_study?: string | null
          spec_how_youre_assessed?: string | null
          spec_learning_outcomes?: Json | null
          spec_prerequisites?: string | null
          spec_published_at?: string | null
          spec_total_qualification_time?: number | null
          spec_who_for?: string | null
          status?: string
          submission_group_id?: string | null
          updated_at?: string
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
        }
        Update: {
          admin_note?: string | null
          ai_cross_check?: Json | null
          ai_draft?: Json | null
          ai_drafted_at?: string | null
          ai_extraction?: Json | null
          ai_red_flags?: string[]
          ai_verdict?: string | null
          awarding_body_reference?: string | null
          created_at?: string
          evidence_doc_paths?: string[]
          evidence_expires_at?: string | null
          evidence_issued_at?: string | null
          evidence_type?: string
          id?: string
          ofqual_found?: boolean
          ofqual_number?: string | null
          ofqual_snapshot?: Json | null
          provider_id?: string
          qualification_id?: string | null
          reps_qualification_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spec_guided_learning_hours?: number | null
          spec_how_youll_study?: string | null
          spec_how_youre_assessed?: string | null
          spec_learning_outcomes?: Json | null
          spec_prerequisites?: string | null
          spec_published_at?: string | null
          spec_total_qualification_time?: number | null
          spec_who_for?: string | null
          status?: string
          submission_group_id?: string | null
          updated_at?: string
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_regulated_permissions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_regulated_permissions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
          {
            foreignKeyName: "provider_regulated_permissions_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      proxy_ingest_diagnostics: {
        Row: {
          attempted: boolean | null
          consent_write_eligible: boolean | null
          created_at: string
          error_code: string | null
          error_details: string | null
          error_hint: string | null
          error_message: string | null
          event_count: number | null
          extracted_path: string | null
          first_event: string | null
          geo_cache_hit: boolean | null
          geo_confidence: string | null
          geo_has_city: boolean | null
          geo_has_lat_lng: boolean | null
          geo_has_region: boolean | null
          geo_provider_attempted: string | null
          geo_provider_result: string | null
          geo_source: string | null
          has_distinct: boolean | null
          has_path: boolean | null
          has_raw_ip: boolean | null
          has_referrer: boolean | null
          has_session: boolean | null
          id: string
          is_admin: boolean | null
          journey_id: string | null
          journey_result: string | null
          method: string | null
          observation_id: string | null
          parser: string | null
          proxy_path: string | null
          raw_ip_source: string | null
          result: string | null
        }
        Insert: {
          attempted?: boolean | null
          consent_write_eligible?: boolean | null
          created_at?: string
          error_code?: string | null
          error_details?: string | null
          error_hint?: string | null
          error_message?: string | null
          event_count?: number | null
          extracted_path?: string | null
          first_event?: string | null
          geo_cache_hit?: boolean | null
          geo_confidence?: string | null
          geo_has_city?: boolean | null
          geo_has_lat_lng?: boolean | null
          geo_has_region?: boolean | null
          geo_provider_attempted?: string | null
          geo_provider_result?: string | null
          geo_source?: string | null
          has_distinct?: boolean | null
          has_path?: boolean | null
          has_raw_ip?: boolean | null
          has_referrer?: boolean | null
          has_session?: boolean | null
          id?: string
          is_admin?: boolean | null
          journey_id?: string | null
          journey_result?: string | null
          method?: string | null
          observation_id?: string | null
          parser?: string | null
          proxy_path?: string | null
          raw_ip_source?: string | null
          result?: string | null
        }
        Update: {
          attempted?: boolean | null
          consent_write_eligible?: boolean | null
          created_at?: string
          error_code?: string | null
          error_details?: string | null
          error_hint?: string | null
          error_message?: string | null
          event_count?: number | null
          extracted_path?: string | null
          first_event?: string | null
          geo_cache_hit?: boolean | null
          geo_confidence?: string | null
          geo_has_city?: boolean | null
          geo_has_lat_lng?: boolean | null
          geo_has_region?: boolean | null
          geo_provider_attempted?: string | null
          geo_provider_result?: string | null
          geo_source?: string | null
          has_distinct?: boolean | null
          has_path?: boolean | null
          has_raw_ip?: boolean | null
          has_referrer?: boolean | null
          has_session?: boolean | null
          id?: string
          is_admin?: boolean | null
          journey_id?: string | null
          journey_result?: string | null
          method?: string | null
          observation_id?: string | null
          parser?: string | null
          proxy_path?: string | null
          raw_ip_source?: string | null
          result?: string | null
        }
        Relationships: []
      }
      public_analytics_consent_events: {
        Row: {
          choice: string
          country_code: string | null
          dnt: boolean
          gpc: boolean
          id: string
          occurred_at: string
          scopes: Json
          session_id: string
          ua_hash: string | null
        }
        Insert: {
          choice: string
          country_code?: string | null
          dnt?: boolean
          gpc?: boolean
          id?: string
          occurred_at?: string
          scopes?: Json
          session_id: string
          ua_hash?: string | null
        }
        Update: {
          choice?: string
          country_code?: string | null
          dnt?: boolean
          gpc?: boolean
          id?: string
          occurred_at?: string
          scopes?: Json
          session_id?: string
          ua_hash?: string | null
        }
        Relationships: []
      }
      public_analytics_ingest_state: {
        Row: {
          created_at: string
          id: string
          last_error: string | null
          last_pulled_date: string | null
          last_run_at: string | null
          last_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          last_error?: string | null
          last_pulled_date?: string | null
          last_run_at?: string | null
          last_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_error?: string | null
          last_pulled_date?: string | null
          last_run_at?: string | null
          last_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      public_visitor_conversions: {
        Row: {
          anonymous_id: string | null
          browser: string | null
          country_code: string | null
          created_at: string
          device: string | null
          enquiry_id: string | null
          event_kind: string
          id: string
          ip_hash: string | null
          occurred_at: string
          path: string | null
          pending_signup_id: string | null
          posthog_distinct_id: string | null
          professional_id: string | null
          properties: Json
          referrer: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          browser?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          enquiry_id?: string | null
          event_kind: string
          id?: string
          ip_hash?: string | null
          occurred_at?: string
          path?: string | null
          pending_signup_id?: string | null
          posthog_distinct_id?: string | null
          professional_id?: string | null
          properties?: Json
          referrer?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          browser?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          enquiry_id?: string | null
          event_kind?: string
          id?: string
          ip_hash?: string | null
          occurred_at?: string
          path?: string | null
          pending_signup_id?: string | null
          posthog_distinct_id?: string | null
          professional_id?: string | null
          properties?: Json
          referrer?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_visitor_conversions_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_visitor_conversions_pending_signup_id_fkey"
            columns: ["pending_signup_id"]
            isOneToOne: false
            referencedRelation: "pending_signups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_visitor_conversions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_visitor_conversions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      qualifications: {
        Row: {
          awarding_body_slug: string
          created_at: string
          id: string
          is_active: boolean
          level: number | null
          ofqual_ref: string | null
          title: string
          title_slug: string | null
          updated_at: string
        }
        Insert: {
          awarding_body_slug: string
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number | null
          ofqual_ref?: string | null
          title: string
          title_slug?: string | null
          updated_at?: string
        }
        Update: {
          awarding_body_slug?: string
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number | null
          ofqual_ref?: string | null
          title?: string
          title_slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      renewal_tokens: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          intended_tier: string
          metadata: Json
          purpose: Database["public"]["Enums"]["renewal_token_purpose"]
          token_hash: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          intended_tier?: string
          metadata?: Json
          purpose: Database["public"]["Enums"]["renewal_token_purpose"]
          token_hash: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          intended_tier?: string
          metadata?: Json
          purpose?: Database["public"]["Enums"]["renewal_token_purpose"]
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      reps_course_evidence: {
        Row: {
          course_id: string
          created_at: string
          file_kind: string
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          provider_id: string
          uploaded_by: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          file_kind: string
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          provider_id: string
          uploaded_by?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          file_kind?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          provider_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reps_course_evidence_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "reps_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      reps_courses: {
        Row: {
          accredited_at: string | null
          admin_note: string | null
          admin_reviewer_aide: Json | null
          admin_reviewer_aide_generated_at: string | null
          ai_deterministic_flags: Json
          ai_draft: Json | null
          ai_drafted_at: string | null
          ai_expand_usage: Json
          ai_red_flags: string[]
          ai_verdict: string | null
          created_at: string
          endorsement_statement_agreed: boolean
          endorsement_statement_check_error: string | null
          endorsement_statement_found: boolean | null
          endorsement_statement_last_checked_at: string | null
          endorsement_statement_url: string | null
          id: string
          official_level: number | null
          official_level_confidence: string | null
          official_level_rationale: string | null
          official_title: string | null
          proposed_credential_type: string | null
          proposed_delivery_mode: string | null
          proposed_extra_notes: string | null
          proposed_how_assessed: string | null
          proposed_learner_outcomes: string | null
          proposed_level: number | null
          proposed_prerequisites: string | null
          proposed_title: string
          proposed_total_hours: number | null
          proposed_tutor_credentials: string | null
          proposed_what_covered: string | null
          proposed_who_for: string | null
          provider_id: string
          reps_qual_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          spec_delivery_mode: string | null
          spec_guided_learning_hours: number | null
          spec_how_youll_study: string | null
          spec_how_youre_assessed: string | null
          spec_learning_outcomes: Json | null
          spec_modules: Json | null
          spec_prerequisites: string | null
          spec_published_at: string | null
          spec_total_qualification_time: number | null
          spec_who_for: string | null
          status: string
          updated_at: string
          withdrawn_at: string | null
          withdrawn_reason: string | null
        }
        Insert: {
          accredited_at?: string | null
          admin_note?: string | null
          admin_reviewer_aide?: Json | null
          admin_reviewer_aide_generated_at?: string | null
          ai_deterministic_flags?: Json
          ai_draft?: Json | null
          ai_drafted_at?: string | null
          ai_expand_usage?: Json
          ai_red_flags?: string[]
          ai_verdict?: string | null
          created_at?: string
          endorsement_statement_agreed?: boolean
          endorsement_statement_check_error?: string | null
          endorsement_statement_found?: boolean | null
          endorsement_statement_last_checked_at?: string | null
          endorsement_statement_url?: string | null
          id?: string
          official_level?: number | null
          official_level_confidence?: string | null
          official_level_rationale?: string | null
          official_title?: string | null
          proposed_credential_type?: string | null
          proposed_delivery_mode?: string | null
          proposed_extra_notes?: string | null
          proposed_how_assessed?: string | null
          proposed_learner_outcomes?: string | null
          proposed_level?: number | null
          proposed_prerequisites?: string | null
          proposed_title: string
          proposed_total_hours?: number | null
          proposed_tutor_credentials?: string | null
          proposed_what_covered?: string | null
          proposed_who_for?: string | null
          provider_id: string
          reps_qual_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          spec_delivery_mode?: string | null
          spec_guided_learning_hours?: number | null
          spec_how_youll_study?: string | null
          spec_how_youre_assessed?: string | null
          spec_learning_outcomes?: Json | null
          spec_modules?: Json | null
          spec_prerequisites?: string | null
          spec_published_at?: string | null
          spec_total_qualification_time?: number | null
          spec_who_for?: string | null
          status?: string
          updated_at?: string
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
        }
        Update: {
          accredited_at?: string | null
          admin_note?: string | null
          admin_reviewer_aide?: Json | null
          admin_reviewer_aide_generated_at?: string | null
          ai_deterministic_flags?: Json
          ai_draft?: Json | null
          ai_drafted_at?: string | null
          ai_expand_usage?: Json
          ai_red_flags?: string[]
          ai_verdict?: string | null
          created_at?: string
          endorsement_statement_agreed?: boolean
          endorsement_statement_check_error?: string | null
          endorsement_statement_found?: boolean | null
          endorsement_statement_last_checked_at?: string | null
          endorsement_statement_url?: string | null
          id?: string
          official_level?: number | null
          official_level_confidence?: string | null
          official_level_rationale?: string | null
          official_title?: string | null
          proposed_credential_type?: string | null
          proposed_delivery_mode?: string | null
          proposed_extra_notes?: string | null
          proposed_how_assessed?: string | null
          proposed_learner_outcomes?: string | null
          proposed_level?: number | null
          proposed_prerequisites?: string | null
          proposed_title?: string
          proposed_total_hours?: number | null
          proposed_tutor_credentials?: string | null
          proposed_what_covered?: string | null
          proposed_who_for?: string | null
          provider_id?: string
          reps_qual_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          spec_delivery_mode?: string | null
          spec_guided_learning_hours?: number | null
          spec_how_youll_study?: string | null
          spec_how_youre_assessed?: string | null
          spec_learning_outcomes?: Json | null
          spec_modules?: Json | null
          spec_prerequisites?: string | null
          spec_published_at?: string | null
          spec_total_qualification_time?: number | null
          spec_who_for?: string | null
          status?: string
          updated_at?: string
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reps_courses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reps_courses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      review_notifications: {
        Row: {
          created_at: string
          id: string
          read_at: string | null
          recipient_role: string
          recipient_user_id: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_role: string
          recipient_user_id: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_role?: string
          recipient_user_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_notifications_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          client_email: string
          client_name: string | null
          created_at: string
          delivered_at: string | null
          expires_at: string
          failed_at: string | null
          failure_reason: string | null
          first_opened_at: string | null
          id: string
          last_opened_at: string | null
          mailgun_message_id: string | null
          open_count: number
          opened_at: string | null
          professional_id: string
          sent_at: string
          service_label: string | null
          status: string
          submitted_at: string | null
          token: string
          updated_at: string
        }
        Insert: {
          client_email: string
          client_name?: string | null
          created_at?: string
          delivered_at?: string | null
          expires_at?: string
          failed_at?: string | null
          failure_reason?: string | null
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          mailgun_message_id?: string | null
          open_count?: number
          opened_at?: string | null
          professional_id: string
          sent_at?: string
          service_label?: string | null
          status?: string
          submitted_at?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          client_email?: string
          client_name?: string | null
          created_at?: string
          delivered_at?: string | null
          expires_at?: string
          failed_at?: string | null
          failure_reason?: string | null
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          mailgun_message_id?: string | null
          open_count?: number
          opened_at?: string | null
          professional_id?: string
          sent_at?: string
          service_label?: string | null
          status?: string
          submitted_at?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_notified_at: string | null
          ai_checked_at: string | null
          ai_flags: Json
          ai_verdict: string | null
          bd_review_id: number | null
          body: string
          client_email: string | null
          client_name: string
          client_user_id: string | null
          created_at: string
          flag_reason: string | null
          flagged_at: string | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          moderation_status: string
          pro_notified_at: string | null
          professional_id: string
          published_at: string | null
          rating: number
          removal_category: string | null
          removal_internal_note: string | null
          removal_notified_at: string | null
          removal_reason: string | null
          responded_at: string | null
          response: string | null
          response_edited_at: string | null
          response_notified_at: string | null
          service_label: string | null
          source: string
          status: string
          submitter_ip: unknown
          submitter_user_agent: string | null
          thanked_at: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          admin_notified_at?: string | null
          ai_checked_at?: string | null
          ai_flags?: Json
          ai_verdict?: string | null
          bd_review_id?: number | null
          body: string
          client_email?: string | null
          client_name: string
          client_user_id?: string | null
          created_at?: string
          flag_reason?: string | null
          flagged_at?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string
          pro_notified_at?: string | null
          professional_id: string
          published_at?: string | null
          rating: number
          removal_category?: string | null
          removal_internal_note?: string | null
          removal_notified_at?: string | null
          removal_reason?: string | null
          responded_at?: string | null
          response?: string | null
          response_edited_at?: string | null
          response_notified_at?: string | null
          service_label?: string | null
          source?: string
          status?: string
          submitter_ip?: unknown
          submitter_user_agent?: string | null
          thanked_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          admin_notified_at?: string | null
          ai_checked_at?: string | null
          ai_flags?: Json
          ai_verdict?: string | null
          bd_review_id?: number | null
          body?: string
          client_email?: string | null
          client_name?: string
          client_user_id?: string | null
          created_at?: string
          flag_reason?: string | null
          flagged_at?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string
          pro_notified_at?: string | null
          professional_id?: string
          published_at?: string | null
          rating?: number
          removal_category?: string | null
          removal_internal_note?: string | null
          removal_notified_at?: string | null
          removal_reason?: string | null
          responded_at?: string | null
          response?: string | null
          response_edited_at?: string | null
          response_notified_at?: string | null
          service_label?: string | null
          source?: string
          status?: string
          submitter_ip?: unknown
          submitter_user_agent?: string | null
          thanked_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      search_appearance_events: {
        Row: {
          created_at: string
          id: number
          location_slug: string | null
          page: number | null
          position: number | null
          profession_slug: string | null
          professional_id: string
          query: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          location_slug?: string | null
          page?: number | null
          position?: number | null
          profession_slug?: string | null
          professional_id: string
          query?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          location_slug?: string | null
          page?: number | null
          position?: number | null
          profession_slug?: string | null
          professional_id?: string
          query?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_appearance_events_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_appearance_events_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      security_visitor_ip_observations: {
        Row: {
          anonymous_id: string | null
          asn: string | null
          city: string | null
          country_code: string | null
          created_at: string
          event_context: string | null
          expires_at: string
          first_seen_at: string
          flagged: boolean
          id: string
          ip_hash: string | null
          ip_prefix_hash: string | null
          last_seen_at: string
          latitude: number | null
          location_confidence: string | null
          location_source: string | null
          longitude: number | null
          org: string | null
          path: string | null
          postal_code: string | null
          posthog_distinct_id: string | null
          professional_id: string | null
          raw_ip: string | null
          referrer: string | null
          region: string | null
          session_id: string | null
          timezone: string | null
          updated_at: string
          user_agent: string | null
          user_agent_hash: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          asn?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          event_context?: string | null
          expires_at?: string
          first_seen_at?: string
          flagged?: boolean
          id?: string
          ip_hash?: string | null
          ip_prefix_hash?: string | null
          last_seen_at?: string
          latitude?: number | null
          location_confidence?: string | null
          location_source?: string | null
          longitude?: number | null
          org?: string | null
          path?: string | null
          postal_code?: string | null
          posthog_distinct_id?: string | null
          professional_id?: string | null
          raw_ip?: string | null
          referrer?: string | null
          region?: string | null
          session_id?: string | null
          timezone?: string | null
          updated_at?: string
          user_agent?: string | null
          user_agent_hash?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          asn?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          event_context?: string | null
          expires_at?: string
          first_seen_at?: string
          flagged?: boolean
          id?: string
          ip_hash?: string | null
          ip_prefix_hash?: string | null
          last_seen_at?: string
          latitude?: number | null
          location_confidence?: string | null
          location_source?: string | null
          longitude?: number | null
          org?: string | null
          path?: string | null
          postal_code?: string | null
          posthog_distinct_id?: string | null
          professional_id?: string | null
          raw_ip?: string | null
          referrer?: string | null
          region?: string | null
          session_id?: string | null
          timezone?: string | null
          updated_at?: string
          user_agent?: string | null
          user_agent_hash?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seo_index_events: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          detected_at: string
          id: string
          next: Json | null
          prev: Json | null
          severity: string
          summary: string
          url: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          detected_at?: string
          id?: string
          next?: Json | null
          prev?: Json | null
          severity: string
          summary: string
          url: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          detected_at?: string
          id?: string
          next?: Json | null
          prev?: Json | null
          severity?: string
          summary?: string
          url?: string
        }
        Relationships: []
      }
      seo_index_status: {
        Row: {
          coverage_state: string | null
          first_checked_at: string
          google_canonical: string | null
          indexing_state: string | null
          last_changed_at: string | null
          last_checked_at: string
          last_crawl_time: string | null
          page_fetch_state: string | null
          priority: string
          raw: Json | null
          robots_state: string | null
          url: string
          user_canonical: string | null
          verdict: string | null
        }
        Insert: {
          coverage_state?: string | null
          first_checked_at?: string
          google_canonical?: string | null
          indexing_state?: string | null
          last_changed_at?: string | null
          last_checked_at?: string
          last_crawl_time?: string | null
          page_fetch_state?: string | null
          priority?: string
          raw?: Json | null
          robots_state?: string | null
          url: string
          user_canonical?: string | null
          verdict?: string | null
        }
        Update: {
          coverage_state?: string | null
          first_checked_at?: string
          google_canonical?: string | null
          indexing_state?: string | null
          last_changed_at?: string | null
          last_checked_at?: string
          last_crawl_time?: string | null
          page_fetch_state?: string | null
          priority?: string
          raw?: Json | null
          robots_state?: string | null
          url?: string
          user_canonical?: string | null
          verdict?: string | null
        }
        Relationships: []
      }
      seo_scan_runs: {
        Row: {
          batch_kind: string
          errors: number
          finished_at: string | null
          id: string
          notes: string | null
          started_at: string
          status: string
          urls_changed: number
          urls_checked: number
        }
        Insert: {
          batch_kind?: string
          errors?: number
          finished_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          urls_changed?: number
          urls_checked?: number
        }
        Update: {
          batch_kind?: string
          errors?: number
          finished_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          urls_changed?: number
          urls_checked?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          awarding_body: string | null
          bullets: string[]
          created_at: string
          cta_label: string | null
          description: string | null
          duration_minutes: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          mode: string
          price_label: string | null
          price_pence: number | null
          price_unit: string | null
          professional_id: string
          qualification_level: string | null
          seats_taken: number
          seats_total: number | null
          service_kind: string
          sort_order: number
          starts_at: string | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          awarding_body?: string | null
          bullets?: string[]
          created_at?: string
          cta_label?: string | null
          description?: string | null
          duration_minutes?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          mode?: string
          price_label?: string | null
          price_pence?: number | null
          price_unit?: string | null
          professional_id: string
          qualification_level?: string | null
          seats_taken?: number
          seats_total?: number | null
          service_kind?: string
          sort_order?: number
          starts_at?: string | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          awarding_body?: string | null
          bullets?: string[]
          created_at?: string
          cta_label?: string | null
          description?: string | null
          duration_minutes?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          mode?: string
          price_label?: string | null
          price_pence?: number | null
          price_unit?: string | null
          professional_id?: string
          qualification_level?: string | null
          seats_taken?: number
          seats_total?: number | null
          service_kind?: string
          sort_order?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          cancellation_notes: string | null
          cancellation_reason: string | null
          cancelled_email: string | null
          cancelled_full_name: string | null
          closed_by_actor: string | null
          created_at: string
          current_period_end: string | null
          dispute_id: string | null
          environment: string
          id: string
          is_founding: boolean
          metadata: Json | null
          migrated_from_bd: boolean
          owner_id: string | null
          owner_type: Database["public"]["Enums"]["subscription_owner_type"]
          payment_standing: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          cancellation_notes?: string | null
          cancellation_reason?: string | null
          cancelled_email?: string | null
          cancelled_full_name?: string | null
          closed_by_actor?: string | null
          created_at?: string
          current_period_end?: string | null
          dispute_id?: string | null
          environment?: string
          id?: string
          is_founding?: boolean
          metadata?: Json | null
          migrated_from_bd?: boolean
          owner_id?: string | null
          owner_type?: Database["public"]["Enums"]["subscription_owner_type"]
          payment_standing?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          cancellation_notes?: string | null
          cancellation_reason?: string | null
          cancelled_email?: string | null
          cancelled_full_name?: string | null
          closed_by_actor?: string | null
          created_at?: string
          current_period_end?: string | null
          dispute_id?: string | null
          environment?: string
          id?: string
          is_founding?: boolean
          metadata?: Json | null
          migrated_from_bd?: boolean
          owner_id?: string | null
          owner_type?: Database["public"]["Enums"]["subscription_owner_type"]
          payment_standing?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      support_attachments: {
        Row: {
          created_at: string
          filename: string
          id: string
          message_id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          message_id: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          message_id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_user_id: string | null
          body_html: string | null
          body_text: string | null
          created_at: string
          direction: Database["public"]["Enums"]["support_msg_direction"]
          email_references: string | null
          from_email: string | null
          from_name: string | null
          id: string
          in_reply_to: string | null
          is_auto: boolean
          mailgun_message_id: string | null
          ticket_id: string
        }
        Insert: {
          author_user_id?: string | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["support_msg_direction"]
          email_references?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          is_auto?: boolean
          mailgun_message_id?: string | null
          ticket_id: string
        }
        Update: {
          author_user_id?: string | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["support_msg_direction"]
          email_references?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          is_auto?: boolean
          mailgun_message_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          closed_at: string | null
          created_at: string
          deleted_at: string | null
          first_response_at: string | null
          first_viewed_at: string | null
          first_viewed_by: string | null
          id: string
          inbox: string
          is_unread: boolean
          last_message_at: string
          last_opened_at: string | null
          last_opened_by: string | null
          priority: Database["public"]["Enums"]["support_priority"]
          reopened_from_ticket_id: string | null
          requester_email: string
          requester_name: string | null
          requester_unread: boolean
          requester_user_id: string | null
          sla_due_at: string | null
          snoozed_until: string | null
          solved_at: string | null
          source: Database["public"]["Enums"]["support_source"]
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          tags: string[]
          thread_key: string | null
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          closed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          first_response_at?: string | null
          first_viewed_at?: string | null
          first_viewed_by?: string | null
          id?: string
          inbox?: string
          is_unread?: boolean
          last_message_at?: string
          last_opened_at?: string | null
          last_opened_by?: string | null
          priority?: Database["public"]["Enums"]["support_priority"]
          reopened_from_ticket_id?: string | null
          requester_email: string
          requester_name?: string | null
          requester_unread?: boolean
          requester_user_id?: string | null
          sla_due_at?: string | null
          snoozed_until?: string | null
          solved_at?: string | null
          source?: Database["public"]["Enums"]["support_source"]
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          tags?: string[]
          thread_key?: string | null
          ticket_number?: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          closed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          first_response_at?: string | null
          first_viewed_at?: string | null
          first_viewed_by?: string | null
          id?: string
          inbox?: string
          is_unread?: boolean
          last_message_at?: string
          last_opened_at?: string | null
          last_opened_by?: string | null
          priority?: Database["public"]["Enums"]["support_priority"]
          reopened_from_ticket_id?: string | null
          requester_email?: string
          requester_name?: string | null
          requester_unread?: boolean
          requester_user_id?: string | null
          sla_due_at?: string | null
          snoozed_until?: string | null
          solved_at?: string | null
          source?: Database["public"]["Enums"]["support_source"]
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          tags?: string[]
          thread_key?: string | null
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_reopened_from_ticket_id_fkey"
            columns: ["reopened_from_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          anon_id: string | null
          browser: string | null
          city: string | null
          country_code: string | null
          current_path: string | null
          device: string | null
          ended_at: string | null
          geo_source: string | null
          id: string
          ip: string | null
          ip_hash: string | null
          is_admin_view: boolean
          last_seen_at: string
          latitude: number | null
          longitude: number | null
          os: string | null
          pages_viewed: number
          referrer: string | null
          region: string | null
          started_at: string
          timezone: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          anon_id?: string | null
          browser?: string | null
          city?: string | null
          country_code?: string | null
          current_path?: string | null
          device?: string | null
          ended_at?: string | null
          geo_source?: string | null
          id?: string
          ip?: string | null
          ip_hash?: string | null
          is_admin_view?: boolean
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          pages_viewed?: number
          referrer?: string | null
          region?: string | null
          started_at?: string
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          anon_id?: string | null
          browser?: string | null
          city?: string | null
          country_code?: string | null
          current_path?: string | null
          device?: string | null
          ended_at?: string | null
          geo_source?: string | null
          id?: string
          ip?: string | null
          ip_hash?: string | null
          is_admin_view?: boolean
          last_seen_at?: string
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          pages_viewed?: number
          referrer?: string | null
          region?: string | null
          started_at?: string
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      verification_decisions: {
        Row: {
          checklist: Json
          created_at: string
          decision: string
          gates_snapshot: Json | null
          id: string
          notes: string | null
          override_reason: string | null
          professional_id: string
          reviewer_id: string | null
          stripe_event_id: string | null
          submission_id: string | null
          unlocked_specialisms: string[] | null
          unlocked_tier: string | null
          unlocked_title_slug: string | null
        }
        Insert: {
          checklist?: Json
          created_at?: string
          decision: string
          gates_snapshot?: Json | null
          id?: string
          notes?: string | null
          override_reason?: string | null
          professional_id: string
          reviewer_id?: string | null
          stripe_event_id?: string | null
          submission_id?: string | null
          unlocked_specialisms?: string[] | null
          unlocked_tier?: string | null
          unlocked_title_slug?: string | null
        }
        Update: {
          checklist?: Json
          created_at?: string
          decision?: string
          gates_snapshot?: Json | null
          id?: string
          notes?: string | null
          override_reason?: string | null
          professional_id?: string
          reviewer_id?: string | null
          stripe_event_id?: string | null
          submission_id?: string | null
          unlocked_specialisms?: string[] | null
          unlocked_tier?: string | null
          unlocked_title_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_decisions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "v_qualifications_review_queue"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "verification_decisions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "verification_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_notifications: {
        Row: {
          context: Json | null
          created_at: string
          event: string
          id: string
          policy_id: string | null
          professional_id: string
          read_at: string | null
          threshold_days: number | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          event: string
          id?: string
          policy_id?: string | null
          professional_id: string
          read_at?: string | null
          threshold_days?: number | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          event?: string
          id?: string
          policy_id?: string | null
          professional_id?: string
          read_at?: string | null
          threshold_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_notifications_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      verification_renewal_nudges: {
        Row: {
          id: string
          kind: string
          sent_at: string
          submission_id: string
        }
        Insert: {
          id?: string
          kind: string
          sent_at?: string
          submission_id: string
        }
        Update: {
          id?: string
          kind?: string
          sent_at?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_renewal_nudges_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "v_qualifications_review_queue"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "verification_renewal_nudges_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "verification_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_submissions: {
        Row: {
          admin_note: string | null
          ai_extraction: Json | null
          awarding_body: string
          awarding_body_slug: string | null
          centre_number: string | null
          certificate_number: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          derived_specialism_slugs: string[] | null
          derived_title_slug: string | null
          doc_paths: string[]
          duplicate_of: string | null
          expiry_date: string | null
          file_sha256: string | null
          holder_name: string | null
          id: string
          issue_date: string | null
          learner_number: string | null
          name_match: boolean | null
          professional_id: string
          qualification: string
          qualification_number: string | null
          regulator_record: Json | null
          regulator_verified: boolean
          review_checklist: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_submission_status"]
          tamper_signals: Json | null
          trust_signals: Json | null
          updated_at: string
          verify_token: string | null
          year: number | null
        }
        Insert: {
          admin_note?: string | null
          ai_extraction?: Json | null
          awarding_body: string
          awarding_body_slug?: string | null
          centre_number?: string | null
          certificate_number?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          derived_specialism_slugs?: string[] | null
          derived_title_slug?: string | null
          doc_paths?: string[]
          duplicate_of?: string | null
          expiry_date?: string | null
          file_sha256?: string | null
          holder_name?: string | null
          id?: string
          issue_date?: string | null
          learner_number?: string | null
          name_match?: boolean | null
          professional_id: string
          qualification: string
          qualification_number?: string | null
          regulator_record?: Json | null
          regulator_verified?: boolean
          review_checklist?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_submission_status"]
          tamper_signals?: Json | null
          trust_signals?: Json | null
          updated_at?: string
          verify_token?: string | null
          year?: number | null
        }
        Update: {
          admin_note?: string | null
          ai_extraction?: Json | null
          awarding_body?: string
          awarding_body_slug?: string | null
          centre_number?: string | null
          certificate_number?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          derived_specialism_slugs?: string[] | null
          derived_title_slug?: string | null
          doc_paths?: string[]
          duplicate_of?: string | null
          expiry_date?: string | null
          file_sha256?: string | null
          holder_name?: string | null
          id?: string
          issue_date?: string | null
          learner_number?: string | null
          name_match?: boolean | null
          professional_id?: string
          qualification?: string
          qualification_number?: string | null
          regulator_record?: Json | null
          regulator_verified?: boolean
          review_checklist?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_submission_status"]
          tamper_signals?: Json | null
          trust_signals?: Json | null
          updated_at?: string
          verify_token?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_submissions_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "v_qualifications_review_queue"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "verification_submissions_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "verification_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_submissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_submissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      visitor_journeys: {
        Row: {
          created_at: string
          entry_path: string | null
          entry_referrer: string | null
          event_count: number
          event_history: Json
          expires_at: string
          first_seen_at: string
          id: string
          last_seen_at: string
          latest_event: string | null
          latest_observation_id: string | null
          latest_path: string | null
          page_count: number
          path_history: Json
          posthog_distinct_id: string | null
          session_id: string | null
          source: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entry_path?: string | null
          entry_referrer?: string | null
          event_count?: number
          event_history?: Json
          expires_at?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          latest_event?: string | null
          latest_observation_id?: string | null
          latest_path?: string | null
          page_count?: number
          path_history?: Json
          posthog_distinct_id?: string | null
          session_id?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entry_path?: string | null
          entry_referrer?: string | null
          event_count?: number
          event_history?: Json
          expires_at?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          latest_event?: string | null
          latest_observation_id?: string | null
          latest_path?: string | null
          page_count?: number
          path_history?: Json
          posthog_distinct_id?: string | null
          session_id?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_journeys_latest_observation_id_fkey"
            columns: ["latest_observation_id"]
            isOneToOne: false
            referencedRelation: "security_visitor_ip_observations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_client_results: {
        Row: {
          body: string | null
          created_at: string
          headline: string | null
          id: string
          is_published: boolean
          review_id: string | null
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          is_published?: boolean
          review_id?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          is_published?: boolean
          review_id?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_front_client_results_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      website_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      website_transformations: {
        Row: {
          client_first_name: string | null
          client_role: string | null
          created_at: string
          duration_label: string | null
          headline: string | null
          id: string
          image_url: string | null
          is_published: boolean
          metric: string | null
          quote: string | null
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_first_name?: string | null
          client_role?: string | null
          created_at?: string
          duration_label?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          metric?: string | null
          quote?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_first_name?: string | null
          client_role?: string | null
          created_at?: string
          duration_label?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          metric?: string | null
          quote?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      websites: {
        Row: {
          about: string | null
          accent_hex: string | null
          client_results_intro: string | null
          coaching_reach: Json
          created_at: string
          current_clients: number | null
          faq_auto_generated: boolean
          has_unpublished_changes: boolean
          hero_image_url: string | null
          layout_variant: string
          method_intro: string | null
          method_name: string | null
          method_pillars: Json
          professional_id: string
          published_at: string | null
          published_snapshot: Json | null
          subtitle: string | null
          tagline: string | null
          theme: string
          updated_at: string
          venues: Json
        }
        Insert: {
          about?: string | null
          accent_hex?: string | null
          client_results_intro?: string | null
          coaching_reach?: Json
          created_at?: string
          current_clients?: number | null
          faq_auto_generated?: boolean
          has_unpublished_changes?: boolean
          hero_image_url?: string | null
          layout_variant?: string
          method_intro?: string | null
          method_name?: string | null
          method_pillars?: Json
          professional_id: string
          published_at?: string | null
          published_snapshot?: Json | null
          subtitle?: string | null
          tagline?: string | null
          theme?: string
          updated_at?: string
          venues?: Json
        }
        Update: {
          about?: string | null
          accent_hex?: string | null
          client_results_intro?: string | null
          coaching_reach?: Json
          created_at?: string
          current_clients?: number | null
          faq_auto_generated?: boolean
          has_unpublished_changes?: boolean
          hero_image_url?: string | null
          layout_variant?: string
          method_intro?: string | null
          method_name?: string | null
          method_pillars?: Json
          professional_id?: string
          published_at?: string | null
          published_snapshot?: Json | null
          subtitle?: string | null
          tagline?: string | null
          theme?: string
          updated_at?: string
          venues?: Json
        }
        Relationships: [
          {
            foreignKeyName: "shop_fronts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_fronts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
    }
    Views: {
      professional_review_stats: {
        Row: {
          avg_rating: number | null
          professional_id: string | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
      provider_pending_queue: {
        Row: {
          created_at: string | null
          current_value: Json | null
          field_group: string | null
          field_key: string | null
          id: string | null
          proposed_value: Json | null
          provider_id: string | null
          source: string | null
          status: string | null
        }
        Relationships: []
      }
      v_identity_review_queue: {
        Row: {
          document_id: string | null
          full_name: string | null
          identity_status: string | null
          identity_verified_at: string | null
          identity_verified_name: string | null
          professional_id: string | null
          submission_count: number | null
          submitted_at: string | null
        }
        Relationships: []
      }
      v_qualifications_review_queue: {
        Row: {
          awarding_body: string | null
          awarding_body_slug: string | null
          certificate_number: string | null
          claimed_at: string | null
          claimed_by: string | null
          duplicate_of: string | null
          expiry_date: string | null
          full_name: string | null
          holder_name: string | null
          professional_id: string | null
          qualification: string | null
          qualification_number: string | null
          resubmission_count: number | null
          reviewed_at: string | null
          status:
            | Database["public"]["Enums"]["verification_submission_status"]
            | null
          submission_id: string | null
          submitted_at: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_submissions_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "v_qualifications_review_queue"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "verification_submissions_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "verification_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_submissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_submissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_identity_review_queue"
            referencedColumns: ["professional_id"]
          },
        ]
      }
    }
    Functions: {
      _seed_one_demo_pro: {
        Args: {
          _avatar: string
          _bio: string
          _city: string
          _country_code: string
          _email: string
          _full_name: string
          _headline: string
          _lat: number
          _lon: number
          _profession: string
          _slug: string
          _specs: string[]
        }
        Returns: string
      }
      accept_client_invite: { Args: { _token_hash: string }; Returns: string }
      admin_get_recovery_email_log: {
        Args: { _email: string; _limit?: number }
        Returns: {
          created_at: string
          error_message: string
          id: string
          status: string
        }[]
      }
      admin_get_recovery_sent_at: {
        Args: { _user_id: string }
        Returns: string
      }
      admin_moderate_review:
        | {
            Args: { _action: string; _note?: string; _review_id: string }
            Returns: undefined
          }
        | {
            Args: {
              _action: string
              _category?: string
              _internal_note?: string
              _note?: string
              _review_id: string
            }
            Returns: undefined
          }
      admin_seed_all_bd_members: {
        Args: { _limit?: number }
        Returns: {
          failed: number
          seeded: number
        }[]
      }
      admin_seed_demo_pros: { Args: never; Returns: number }
      apply_provider_change: {
        Args: { _request_id: string }
        Returns: undefined
      }
      assign_reps_member_id: {
        Args: { _professional_id: string }
        Returns: string
      }
      audit_verification_drift: {
        Args: never
        Returns: {
          fully_verified: boolean
          professional_id: string
          reason: string
          slug: string
          verification: string
          verification_status: string
        }[]
      }
      cleanup_pending_signups: { Args: never; Returns: undefined }
      clear_pro_review_response: {
        Args: { _review_id: string }
        Returns: undefined
      }
      compute_pro_quality_score: { Args: { _pro_id: string }; Returns: number }
      consume_renewal_token: {
        Args: { _token_hash: string }
        Returns: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          intended_tier: string
          metadata: Json
          purpose: Database["public"]["Enums"]["renewal_token_purpose"]
          token_hash: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "renewal_tokens"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      convert_lead_to_client: { Args: { _enquiry_id: string }; Returns: string }
      count_confirmed_pro_signups: {
        Args: { _since: string; _until?: string }
        Returns: number
      }
      count_confirmed_professionals: {
        Args: { _only_published?: boolean; _verification?: string }
        Returns: number
      }
      count_confirmed_signups: {
        Args: { _from: string; _to: string }
        Returns: {
          day: string
          signups: number
        }[]
      }
      count_orphan_subscriptions: { Args: never; Returns: number }
      count_provider_issued_certificates: {
        Args: { _provider_id: string }
        Returns: number
      }
      credit_tier_policy: {
        Args: { _tier: Database["public"]["Enums"]["subscription_tier"] }
        Returns: {
          ceiling: number
          monthly_refill: number
          signup_grant: number
        }[]
      }
      cron_should_run_at_london: {
        Args: { _hour: number; _job_name: string; _minute: number }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enter_churn_stage: {
        Args: {
          _metadata?: Json
          _reason?: string
          _source_event?: string
          _stage: Database["public"]["Enums"]["churn_stage"]
          _user_id: string
        }
        Returns: {
          created_at: string
          entered_at: string
          id: string
          last_nudge_at: string | null
          metadata: Json
          nudge_count: number
          reason: string | null
          source_event: string | null
          stage: Database["public"]["Enums"]["churn_stage"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "churn_lifecycle"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      erase_user_pii: { Args: { _user_id: string }; Returns: Json }
      fan_out_review_notifications: {
        Args: { _professional_id: string; _review_id: string }
        Returns: undefined
      }
      get_confirmed_professional_ids: {
        Args: { _ids: string[] }
        Returns: string[]
      }
      get_invite_by_token: {
        Args: { _token_hash: string }
        Returns: {
          email: string
          expires_at: string
          full_name: string
          id: string
          professional_id: string
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      get_public_verify_record: {
        Args: { _token: string }
        Returns: {
          approved_at: string
          awarding_body: string
          awarding_body_slug: string
          certificate_number: string
          expiry_date: string
          holder_name: string
          id: string
          issue_year: number
          professional_full_name: string
          professional_id: string
          professional_slug: string
          qualification: string
        }[]
      }
      get_relaunch_audience: {
        Args: never
        Returns: {
          email: string
          source: string
        }[]
      }
      get_renewal_cron_runs: {
        Args: { _limit?: number }
        Returns: {
          end_time: string
          jobname: string
          return_message: string
          start_time: string
          status: string
        }[]
      }
      get_review_request_by_token: {
        Args: { _token: string }
        Returns: {
          client_email: string
          client_name: string
          expires_at: string
          id: string
          professional_id: string
          professional_name: string
          professional_slug: string
          service_label: string
          status: string
        }[]
      }
      get_site_time_info: { Args: never; Returns: Json }
      get_user_ids_by_email: {
        Args: { _email: string }
        Returns: {
          user_id: string
        }[]
      }
      grant_credit_topup: {
        Args: {
          _credits: number
          _pack?: string
          _stripe_session_id: string
          _user_id: string
        }
        Returns: number
      }
      grant_credits: {
        Args: {
          _action: string
          _amount: number
          _metadata?: Json
          _related_id?: string
          _respect_ceiling?: boolean
          _user_id: string
        }
        Returns: number
      }
      has_active_paid_membership: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_active_tier: {
        Args: {
          _tiers: Database["public"]["Enums"]["subscription_tier"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insurance_check_renewals: { Args: never; Returns: number }
      is_coach_of: {
        Args: { _client_id: string; _pro_id: string }
        Returns: boolean
      }
      is_in_payment_dispute: { Args: { _user_id: string }; Returns: boolean }
      is_organisation_member: {
        Args: { _organisation_id: string; _user_id: string }
        Returns: boolean
      }
      is_pro_fully_verified: { Args: { _pro_id: string }; Returns: boolean }
      is_pro_hidden_by_churn: { Args: { _user_id: string }; Returns: boolean }
      is_pro_publicly_visible: { Args: { _pro_id: string }; Returns: boolean }
      link_visitor_to_user: {
        Args: { _distinct_id: string; _user_id: string }
        Returns: Json
      }
      list_fully_verified_pro_ids: { Args: never; Returns: string[] }
      list_my_unread_support_tickets: {
        Args: never
        Returns: {
          created_at: string
          id: string
          last_message_at: string
          subject: string
          ticket_number: string
        }[]
      }
      list_prospect_tags: {
        Args: never
        Returns: {
          count: number
          list_tag: string
        }[]
      }
      list_publicly_visible_pro_ids: {
        Args: never
        Returns: {
          id: string
        }[]
      }
      log_admin_action: {
        Args: {
          _action: string
          _actor_id: string
          _after_state?: Json
          _before_state?: Json
          _ip?: unknown
          _reason?: string
          _target_id?: string
          _target_table?: string
          _user_agent?: string
        }
        Returns: string
      }
      log_visitor_ip_reveal: {
        Args: { _journey_id: string; _observation_id: string; _reason?: string }
        Returns: undefined
      }
      mark_all_my_support_read: { Args: never; Returns: undefined }
      mark_my_support_ticket_read: {
        Args: { _ticket_id: string }
        Returns: undefined
      }
      mark_review_request_opened: {
        Args: { _token: string }
        Returns: undefined
      }
      mark_verification_notifications_read: { Args: never; Returns: number }
      mark_website_dirty_for_pro: {
        Args: { _pro_id: string }
        Returns: undefined
      }
      mint_renewal_token: {
        Args: {
          _intended_tier?: string
          _metadata?: Json
          _purpose: Database["public"]["Enums"]["renewal_token_purpose"]
          _token_hash: string
          _ttl_days?: number
          _user_id: string
        }
        Returns: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          intended_tier: string
          metadata: Json
          purpose: Database["public"]["Enums"]["renewal_token_purpose"]
          token_hash: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "renewal_tokens"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      next_certificate_number: { Args: never; Returns: string }
      next_reps_qual_number: { Args: never; Returns: string }
      ops_admin_emails: {
        Args: never
        Returns: {
          email: string
        }[]
      }
      ops_alerts_evaluate: { Args: never; Returns: number }
      ops_alerts_open_count: { Args: never; Returns: number }
      ops_db_health: { Args: never; Returns: Json }
      ops_find_member: {
        Args: { _q: string }
        Returns: {
          email: string
          full_name: string
          match_kind: string
          user_id: string
        }[]
      }
      peek_renewal_token: {
        Args: { _token_hash: string }
        Returns: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          intended_tier: string
          metadata: Json
          purpose: Database["public"]["Enums"]["renewal_token_purpose"]
          token_hash: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "renewal_tokens"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      platform_health_snapshot: { Args: never; Returns: Json }
      prune_visitor_ip_observations: { Args: never; Returns: undefined }
      purge_activity_detail: {
        Args: never
        Returns: {
          deleted_auth_events: number
          deleted_session_events: number
          deleted_user_sessions: number
        }[]
      }
      purge_expired_ip_observations: { Args: never; Returns: Json }
      purge_orphan_professional_signups: {
        Args: { _min_age_hours?: number }
        Returns: {
          deleted_user_id: string
          email: string
        }[]
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recompute_pro_verification: {
        Args: { _pro_id: string }
        Returns: undefined
      }
      recompute_verification_daily_sweep: { Args: never; Returns: number }
      record_churn_nudge: { Args: { _user_id: string }; Returns: undefined }
      refresh_pro_quality_score: {
        Args: { _pro_id: string }
        Returns: undefined
      }
      resolve_onboarding_stage: {
        Args: { _user_id: string }
        Returns: {
          stage: string
          stage_entered_at: string
        }[]
      }
      run_monthly_credit_refills: { Args: never; Returns: number }
      search_profiles_by_id_prefix: {
        Args: { _q: string }
        Returns: {
          business_name: string
          full_name: string
          id: string
        }[]
      }
      seed_bd_member_into_directory: {
        Args: { _bd_member_id: number; _user_id: string }
        Returns: undefined
      }
      slugify_unique: { Args: { _base: string }; Returns: string }
      spend_credits: {
        Args: {
          _action: string
          _cost: number
          _metadata?: Json
          _related_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      submit_review_by_token: {
        Args: {
          _body: string
          _client_name: string
          _ip?: string
          _rating: number
          _title: string
          _token: string
          _user_agent?: string
        }
        Returns: string
      }
      support_run_maintenance: {
        Args: never
        Returns: {
          auto_closed: number
          hard_purged: number
        }[]
      }
      sweep_orphan_subscriptions: { Args: never; Returns: number }
      test_user_deletion_dry_run: { Args: { _user_id: string }; Returns: Json }
      upsert_pro_review_response: {
        Args: { _response: string; _review_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "professional" | "client"
      bd_member_claim_status: "staged" | "invited" | "claimed" | "skipped"
      bd_member_photo_status:
        | "pending"
        | "ok"
        | "rejected"
        | "missing"
        | "fetch_error"
      bd_migration_status:
        | "pending"
        | "account_created"
        | "subscription_created"
        | "failed"
        | "skipped"
        | "seeded"
      billing_period: "monthly" | "annual"
      booking_status:
        | "pending"
        | "paid"
        | "refunded"
        | "partially_refunded"
        | "failed"
        | "canceled"
        | "disputed"
      campaign_recipient_status:
        | "queued"
        | "sent"
        | "delivered"
        | "failed"
        | "bounced"
        | "complained"
        | "replied"
        | "unsubscribed"
      churn_stage:
        | "active"
        | "at_risk"
        | "grace"
        | "lapsed"
        | "recovered"
        | "dormant"
      coach_client_status: "active" | "paused" | "ended"
      course_delivery_mode: "in-person" | "online" | "hybrid"
      course_status: "pending" | "accredited" | "rejected" | "expired"
      invite_status: "pending" | "accepted" | "expired" | "revoked"
      invite_trigger_reason:
        | "confirmed"
        | "programme_assigned"
        | "payment_received"
        | "manual_resend"
        | "manual_create"
      lead_band: "cold" | "warm" | "hot"
      lead_priority: "low" | "medium" | "high"
      lead_stage:
        | "new"
        | "contacted"
        | "call_booked"
        | "proposal_sent"
        | "trial_booked"
        | "converted"
        | "lost"
      mailing_list_deletion_reason:
        | "admin_cancel_immediate"
        | "admin_cancel_period_end"
        | "admin_end_trial"
        | "admin_delete"
        | "member_request"
        | "self_delete"
        | "stripe_uncollectible"
      organisation_user_role: "owner" | "manager"
      prospect_status: "active" | "converted" | "unsubscribed" | "bounced"
      provider_change_status: "pending" | "approved" | "rejected" | "superseded"
      provider_review_source: "open" | "verified"
      provider_review_status:
        | "pending_email"
        | "published"
        | "flagged"
        | "evidence_requested"
        | "removed"
      renewal_token_purpose: "card_needed" | "payment_failed" | "reactivate"
      reps_level: "Level_2" | "Level_3" | "Level_4" | "Level_5"
      roster_status: "prospect" | "confirmed" | "active" | "archived"
      sex_at_birth: "female" | "male" | "prefer_not_to_say"
      subscription_owner_type: "user" | "organisation"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
      subscription_tier:
        | "free"
        | "pro"
        | "verified"
        | "studio"
        | "training_provider"
      support_msg_direction: "inbound" | "outbound" | "internal_note"
      support_priority: "urgent" | "high" | "normal" | "low"
      support_source: "email" | "web" | "admin" | "api" | "contact_form"
      support_status: "new" | "open" | "pending" | "solved" | "closed" | "spam"
      verification_state: "pending" | "verified" | "unverified" | "expired"
      verification_status: "pending" | "verified" | "rejected" | "suspended"
      verification_submission_status:
        | "submitted"
        | "approved"
        | "rejected"
        | "changes_requested"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "professional", "client"],
      bd_member_claim_status: ["staged", "invited", "claimed", "skipped"],
      bd_member_photo_status: [
        "pending",
        "ok",
        "rejected",
        "missing",
        "fetch_error",
      ],
      bd_migration_status: [
        "pending",
        "account_created",
        "subscription_created",
        "failed",
        "skipped",
        "seeded",
      ],
      billing_period: ["monthly", "annual"],
      booking_status: [
        "pending",
        "paid",
        "refunded",
        "partially_refunded",
        "failed",
        "canceled",
        "disputed",
      ],
      campaign_recipient_status: [
        "queued",
        "sent",
        "delivered",
        "failed",
        "bounced",
        "complained",
        "replied",
        "unsubscribed",
      ],
      churn_stage: [
        "active",
        "at_risk",
        "grace",
        "lapsed",
        "recovered",
        "dormant",
      ],
      coach_client_status: ["active", "paused", "ended"],
      course_delivery_mode: ["in-person", "online", "hybrid"],
      course_status: ["pending", "accredited", "rejected", "expired"],
      invite_status: ["pending", "accepted", "expired", "revoked"],
      invite_trigger_reason: [
        "confirmed",
        "programme_assigned",
        "payment_received",
        "manual_resend",
        "manual_create",
      ],
      lead_band: ["cold", "warm", "hot"],
      lead_priority: ["low", "medium", "high"],
      lead_stage: [
        "new",
        "contacted",
        "call_booked",
        "proposal_sent",
        "trial_booked",
        "converted",
        "lost",
      ],
      mailing_list_deletion_reason: [
        "admin_cancel_immediate",
        "admin_cancel_period_end",
        "admin_end_trial",
        "admin_delete",
        "member_request",
        "self_delete",
        "stripe_uncollectible",
      ],
      organisation_user_role: ["owner", "manager"],
      prospect_status: ["active", "converted", "unsubscribed", "bounced"],
      provider_change_status: ["pending", "approved", "rejected", "superseded"],
      provider_review_source: ["open", "verified"],
      provider_review_status: [
        "pending_email",
        "published",
        "flagged",
        "evidence_requested",
        "removed",
      ],
      renewal_token_purpose: ["card_needed", "payment_failed", "reactivate"],
      reps_level: ["Level_2", "Level_3", "Level_4", "Level_5"],
      roster_status: ["prospect", "confirmed", "active", "archived"],
      sex_at_birth: ["female", "male", "prefer_not_to_say"],
      subscription_owner_type: ["user", "organisation"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "paused",
      ],
      subscription_tier: [
        "free",
        "pro",
        "verified",
        "studio",
        "training_provider",
      ],
      support_msg_direction: ["inbound", "outbound", "internal_note"],
      support_priority: ["urgent", "high", "normal", "low"],
      support_source: ["email", "web", "admin", "api", "contact_form"],
      support_status: ["new", "open", "pending", "solved", "closed", "spam"],
      verification_state: ["pending", "verified", "unverified", "expired"],
      verification_status: ["pending", "verified", "rejected", "suspended"],
      verification_submission_status: [
        "submitted",
        "approved",
        "rejected",
        "changes_requested",
      ],
    },
  },
} as const
