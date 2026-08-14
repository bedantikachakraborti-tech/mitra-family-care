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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      care_plans: {
        Row: {
          created_at: string
          id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "care_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      care_requests: {
        Row: {
          area: string
          created_at: string
          family_user_id: string | null
          id: string
          match_status: string
          person_name: string
          raw_description: string
          selected_caregiver_id: string | null
          structured: Json
          unmatched_at: string | null
          unmatched_by: string | null
        }
        Insert: {
          area?: string
          created_at?: string
          family_user_id?: string | null
          id?: string
          match_status?: string
          person_name?: string
          raw_description?: string
          selected_caregiver_id?: string | null
          structured?: Json
          unmatched_at?: string | null
          unmatched_by?: string | null
        }
        Update: {
          area?: string
          created_at?: string
          family_user_id?: string | null
          id?: string
          match_status?: string
          person_name?: string
          raw_description?: string
          selected_caregiver_id?: string | null
          structured?: Json
          unmatched_at?: string | null
          unmatched_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_requests_selected_caregiver_id_fkey"
            columns: ["selected_caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
        ]
      }
      care_tasks: {
        Row: {
          buffer_minutes: number
          category: string
          created_at: string
          days: string[]
          details: string
          id: string
          is_active: boolean
          plan_id: string
          scheduled_time: string
          source: string
          time_of_day: string
          title: string
        }
        Insert: {
          buffer_minutes?: number
          category?: string
          created_at?: string
          days?: string[]
          details?: string
          id?: string
          is_active?: boolean
          plan_id: string
          scheduled_time?: string
          source?: string
          time_of_day?: string
          title: string
        }
        Update: {
          buffer_minutes?: number
          category?: string
          created_at?: string
          days?: string[]
          details?: string
          id?: string
          is_active?: boolean
          plan_id?: string
          scheduled_time?: string
          source?: string
          time_of_day?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_matches: {
        Row: {
          caregiver_id: string
          considerations: string
          created_at: string
          id: string
          rationale: string
          request_id: string
          score: number
        }
        Insert: {
          caregiver_id: string
          considerations?: string
          created_at?: string
          id?: string
          rationale?: string
          request_id: string
          score?: number
        }
        Update: {
          caregiver_id?: string
          considerations?: string
          created_at?: string
          id?: string
          rationale?: string
          request_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_matches_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_matches_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "care_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      caregivers: {
        Row: {
          about: string
          area: string
          availability: string
          availability_negotiable: boolean
          certifications: string[]
          created_at: string
          headline: string
          hourly_rate: number
          hours_negotiable: boolean
          id: string
          initials: string
          languages: string[]
          location_negotiable: boolean
          name: string
          preferred_hours: string
          rate_negotiable: boolean
          skills: string[]
          specialties: string[]
          user_id: string | null
          years_experience: number
        }
        Insert: {
          about?: string
          area?: string
          availability?: string
          availability_negotiable?: boolean
          certifications?: string[]
          created_at?: string
          headline?: string
          hourly_rate?: number
          hours_negotiable?: boolean
          id?: string
          initials?: string
          languages?: string[]
          location_negotiable?: boolean
          name: string
          preferred_hours?: string
          rate_negotiable?: boolean
          skills?: string[]
          specialties?: string[]
          user_id?: string | null
          years_experience?: number
        }
        Update: {
          about?: string
          area?: string
          availability?: string
          availability_negotiable?: boolean
          certifications?: string[]
          created_at?: string
          headline?: string
          hourly_rate?: number
          hours_negotiable?: boolean
          id?: string
          initials?: string
          languages?: string[]
          location_negotiable?: boolean
          name?: string
          preferred_hours?: string
          rate_negotiable?: boolean
          skills?: string[]
          specialties?: string[]
          user_id?: string | null
          years_experience?: number
        }
        Relationships: []
      }
      day_summaries: {
        Row: {
          content: string
          created_at: string
          id: string
          plan_id: string
          summary_date: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          plan_id: string
          summary_date?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          plan_id?: string
          summary_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_summaries_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          request_id: string
          sender_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          request_id: string
          sender_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          request_id?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "care_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string
          id: string
          kind: string
          link: string
          read_at: string | null
          request_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          dedupe_key: string
          id?: string
          kind: string
          link?: string
          read_at?: string | null
          request_id?: string | null
          title?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          kind?: string
          link?: string
          read_at?: string | null
          request_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "care_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          location: string
          notify_prompted: boolean
          phone: string
          push_enabled: boolean
          relationship: string
          role: Database["public"]["Enums"]["app_role"]
          ui_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          location?: string
          notify_prompted?: boolean
          phone?: string
          push_enabled?: boolean
          relationship?: string
          role?: Database["public"]["Enums"]["app_role"]
          ui_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          location?: string
          notify_prompted?: boolean
          phone?: string
          push_enabled?: boolean
          relationship?: string
          role?: Database["public"]["Enums"]["app_role"]
          ui_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          categories: string[]
          comment: string
          created_at: string
          id: string
          rating: number
          request_id: string
          reviewee_user_id: string
          reviewer_user_id: string
          updated_at: string
        }
        Insert: {
          categories?: string[]
          comment?: string
          created_at?: string
          id?: string
          rating: number
          request_id: string
          reviewee_user_id: string
          reviewer_user_id: string
          updated_at?: string
        }
        Update: {
          categories?: string[]
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          request_id?: string
          reviewee_user_id?: string
          reviewer_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "care_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      task_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          log_date: string
          note: string
          outside_buffer: boolean
          postponed_to: string
          scheduled_at: string | null
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          log_date?: string
          note?: string
          outside_buffer?: boolean
          postponed_to?: string
          scheduled_at?: string | null
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          log_date?: string
          note?: string
          outside_buffer?: boolean
          postponed_to?: string
          scheduled_at?: string | null
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "care_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_request: { Args: { _request_id: string }; Returns: boolean }
      has_active_match: { Args: { _request_id: string }; Returns: boolean }
      my_caregiver_id: { Args: never; Returns: string }
      owns_request: { Args: { _request_id: string }; Returns: boolean }
      plan_request: { Args: { _plan_id: string }; Returns: string }
      request_counterpart: { Args: { _request_id: string }; Returns: string }
      task_request: { Args: { _task_id: string }; Returns: string }
    }
    Enums: {
      app_role: "family" | "caregiver"
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
      app_role: ["family", "caregiver"],
    },
  },
} as const
