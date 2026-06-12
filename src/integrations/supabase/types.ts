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
        ]
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
          in_person_available: boolean
          insurance_valid_until: string | null
          is_published: boolean
          languages: string[]
          online_available: boolean
          primary_profession: string | null
          public_email: string | null
          reps_level: Database["public"]["Enums"]["reps_level"] | null
          slug: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_tiktok: string | null
          social_x: string | null
          social_youtube: string | null
          specialisms: string[]
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
          in_person_available?: boolean
          insurance_valid_until?: string | null
          is_published?: boolean
          languages?: string[]
          online_available?: boolean
          primary_profession?: string | null
          public_email?: string | null
          reps_level?: Database["public"]["Enums"]["reps_level"] | null
          slug?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_x?: string | null
          social_youtube?: string | null
          specialisms?: string[]
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
          in_person_available?: boolean
          insurance_valid_until?: string | null
          is_published?: boolean
          languages?: string[]
          online_available?: boolean
          primary_profession?: string | null
          public_email?: string | null
          reps_level?: Database["public"]["Enums"]["reps_level"] | null
          slug?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          social_x?: string | null
          social_youtube?: string | null
          specialisms?: string[]
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
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_is_ai_generated?: boolean
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_is_ai_generated?: boolean
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"] | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
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
      verification_submissions: {
        Row: {
          admin_note: string | null
          awarding_body: string
          created_at: string
          doc_paths: string[]
          id: string
          professional_id: string
          qualification: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_submission_status"]
          updated_at: string
          year: number | null
        }
        Insert: {
          admin_note?: string | null
          awarding_body: string
          created_at?: string
          doc_paths?: string[]
          id?: string
          professional_id: string
          qualification: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_submission_status"]
          updated_at?: string
          year?: number | null
        }
        Update: {
          admin_note?: string | null
          awarding_body?: string
          created_at?: string
          doc_paths?: string[]
          id?: string
          professional_id?: string
          qualification?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_submission_status"]
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_submissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_client_invite: { Args: { _token_hash: string }; Returns: string }
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
    }
    Enums: {
      app_role: "admin" | "professional" | "client"
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
