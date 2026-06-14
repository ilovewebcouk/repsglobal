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
      bd_member_seed: {
        Row: {
          about_me: string | null
          address1: string | null
          address2: string | null
          bd_member_id: number
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
          notes: string | null
          phone_raw: string | null
          profile_photo_reject_category: string | null
          profile_photo_reject_reason: string | null
          profile_photo_src: string | null
          profile_photo_status: Database["public"]["Enums"]["bd_member_photo_status"]
          profile_photo_storage_path: string | null
          quote: string | null
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
          notes?: string | null
          phone_raw?: string | null
          profile_photo_reject_category?: string | null
          profile_photo_reject_reason?: string | null
          profile_photo_src?: string | null
          profile_photo_status?: Database["public"]["Enums"]["bd_member_photo_status"]
          profile_photo_storage_path?: string | null
          quote?: string | null
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
          notes?: string | null
          phone_raw?: string | null
          profile_photo_reject_category?: string | null
          profile_photo_reject_reason?: string | null
          profile_photo_src?: string | null
          profile_photo_status?: Database["public"]["Enums"]["bd_member_photo_status"]
          profile_photo_storage_path?: string | null
          quote?: string | null
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
          cover_amount_gbp: number | null
          created_at: string
          doc_path: string
          expiry_date: string
          file_sha256: string | null
          id: string
          policy_number: string | null
          professional_id: string
          provider: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          cover_amount_gbp?: number | null
          created_at?: string
          doc_path: string
          expiry_date: string
          file_sha256?: string | null
          id?: string
          policy_number?: string | null
          professional_id: string
          provider: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          cover_amount_gbp?: number | null
          created_at?: string
          doc_path?: string
          expiry_date?: string
          file_sha256?: string | null
          id?: string
          policy_number?: string | null
          professional_id?: string
          provider?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
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
      legacy_stripe_link: {
        Row: {
          access_expires_at: string | null
          bd_member_id: number
          created_at: string
          current_price_id: string | null
          email: string
          last_attempt_at: string | null
          legacy_kind: string
          link_status: string
          migration_status: string
          notes: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          access_expires_at?: string | null
          bd_member_id: number
          created_at?: string
          current_price_id?: string | null
          email: string
          last_attempt_at?: string | null
          legacy_kind?: string
          link_status?: string
          migration_status?: string
          notes?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          access_expires_at?: string | null
          bd_member_id?: number
          created_at?: string
          current_price_id?: string | null
          email?: string
          last_attempt_at?: string | null
          legacy_kind?: string
          link_status?: string
          migration_status?: string
          notes?: string | null
          stripe_customer_id?: string | null
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
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          stripe_customer_id: string | null
          stripe_event_id: string | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          stripe_customer_id?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          stripe_customer_id?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
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
      professionals: {
        Row: {
          bio: string | null
          cert_uploaded_at: string | null
          city: string | null
          contact_phone: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          dbs_valid_until: string | null
          headline: string | null
          hourly_rate_pence: number | null
          id: string
          identity_status: string
          identity_verified_at: string | null
          identity_verified_dob: string | null
          identity_verified_name: string | null
          in_person_available: boolean
          insurance_valid_until: string | null
          is_published: boolean
          languages: string[]
          locale: string
          online_available: boolean
          primary_profession: string | null
          primary_title_slug: string | null
          public_email: string | null
          reps_level: Database["public"]["Enums"]["reps_level"] | null
          slug: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_tiktok: string | null
          social_x: string | null
          social_youtube: string | null
          specialisms: string[]
          stripe_identity_session_id: string | null
          timezone: string
          trading_name: string | null
          updated_at: string
          verification: Database["public"]["Enums"]["verification_status"]
          verification_grace_until: string | null
          verification_status: Database["public"]["Enums"]["verification_state"]
          website: string | null
        }
        Insert: {
          bio?: string | null
          cert_uploaded_at?: string | null
          city?: string | null
          contact_phone?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          dbs_valid_until?: string | null
          headline?: string | null
          hourly_rate_pence?: number | null
          id: string
          identity_status?: string
          identity_verified_at?: string | null
          identity_verified_dob?: string | null
          identity_verified_name?: string | null
          in_person_available?: boolean
          insurance_valid_until?: string | null
          is_published?: boolean
          languages?: string[]
          locale?: string
          online_available?: boolean
          primary_profession?: string | null
          primary_title_slug?: string | null
          public_email?: string | null
          reps_level?: Database["public"]["Enums"]["reps_level"] | null
          slug?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_x?: string | null
          social_youtube?: string | null
          specialisms?: string[]
          stripe_identity_session_id?: string | null
          timezone?: string
          trading_name?: string | null
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
          verification_grace_until?: string | null
          verification_status?: Database["public"]["Enums"]["verification_state"]
          website?: string | null
        }
        Update: {
          bio?: string | null
          cert_uploaded_at?: string | null
          city?: string | null
          contact_phone?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          dbs_valid_until?: string | null
          headline?: string | null
          hourly_rate_pence?: number | null
          id?: string
          identity_status?: string
          identity_verified_at?: string | null
          identity_verified_dob?: string | null
          identity_verified_name?: string | null
          in_person_available?: boolean
          insurance_valid_until?: string | null
          is_published?: boolean
          languages?: string[]
          locale?: string
          online_available?: boolean
          primary_profession?: string | null
          primary_title_slug?: string | null
          public_email?: string | null
          reps_level?: Database["public"]["Enums"]["reps_level"] | null
          slug?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_x?: string | null
          social_youtube?: string | null
          specialisms?: string[]
          stripe_identity_session_id?: string | null
          timezone?: string
          trading_name?: string | null
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
          verification_grace_until?: string | null
          verification_status?: Database["public"]["Enums"]["verification_state"]
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_is_ai_generated: boolean
          avatar_url: string | null
          business_name: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_is_ai_generated?: boolean
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_is_ai_generated?: boolean
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string
          display_name?: string | null
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
      reviews: {
        Row: {
          body: string
          client_name: string
          client_user_id: string | null
          created_at: string
          id: string
          professional_id: string
          published_at: string | null
          rating: number
          responded_at: string | null
          response: string | null
          source: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body: string
          client_name: string
          client_user_id?: string | null
          created_at?: string
          id?: string
          professional_id: string
          published_at?: string | null
          rating: number
          responded_at?: string | null
          response?: string | null
          source?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          client_name?: string
          client_user_id?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          published_at?: string | null
          rating?: number
          responded_at?: string | null
          response?: string | null
          source?: string
          status?: string
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
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_featured: boolean
          is_published: boolean
          mode: string
          price_label: string | null
          price_pence: number | null
          professional_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          mode?: string
          price_label?: string | null
          price_pence?: number | null
          professional_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          mode?: string
          price_label?: string | null
          price_pence?: number | null
          professional_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
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
      shop_fronts: {
        Row: {
          about: string | null
          accent_hex: string | null
          created_at: string
          hero_image_url: string | null
          is_published: boolean
          layout_variant: string
          professional_id: string
          published_at: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          accent_hex?: string | null
          created_at?: string
          hero_image_url?: string | null
          is_published?: boolean
          layout_variant?: string
          professional_id: string
          published_at?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          accent_hex?: string | null
          created_at?: string
          hero_image_url?: string | null
          is_published?: boolean
          layout_variant?: string
          professional_id?: string
          published_at?: string | null
          tagline?: string | null
          updated_at?: string
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
      subscriptions: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          environment: string
          id: string
          is_founding: boolean
          metadata: Json | null
          migrated_from_bd: boolean
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          is_founding?: boolean
          metadata?: Json | null
          migrated_from_bd?: boolean
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          is_founding?: boolean
          metadata?: Json | null
          migrated_from_bd?: boolean
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          reviewer_id: string
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
          reviewer_id: string
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
          reviewer_id?: string
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
    }
    Views: {
      v_identity_review_queue: {
        Row: {
          display_name: string | null
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
          display_name: string | null
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
      accept_client_invite: { Args: { _token_hash: string }; Returns: string }
      credit_tier_policy: {
        Args: { _tier: Database["public"]["Enums"]["subscription_tier"] }
        Returns: {
          ceiling: number
          monthly_refill: number
          signup_grant: number
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
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
      is_coach_of: {
        Args: { _client_id: string; _pro_id: string }
        Returns: boolean
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
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      run_monthly_credit_refills: { Args: never; Returns: number }
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
      billing_period: "monthly" | "annual"
      coach_client_status: "active" | "paused" | "ended"
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
      reps_level: "Level_2" | "Level_3" | "Level_4" | "Level_5"
      roster_status: "prospect" | "confirmed" | "active" | "archived"
      sex_at_birth: "female" | "male" | "prefer_not_to_say"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
      subscription_tier: "free" | "pro" | "verified" | "studio"
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
      ],
      billing_period: ["monthly", "annual"],
      coach_client_status: ["active", "paused", "ended"],
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
      reps_level: ["Level_2", "Level_3", "Level_4", "Level_5"],
      roster_status: ["prospect", "confirmed", "active", "archived"],
      sex_at_birth: ["female", "male", "prefer_not_to_say"],
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
      subscription_tier: ["free", "pro", "verified", "studio"],
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
