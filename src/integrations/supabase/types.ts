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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          request_count: number | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          calorie_target: number | null
          completed_exercise_at: string | null
          completed_meal_at: string | null
          completed_pilates_at: string | null
          completed_yoga_at: string | null
          created_at: string
          daily_water_target_liters: number
          exercise_instructions: string | null
          exercise_title: string | null
          exercises_json: Json | null
          id: string
          is_completed_exercise: boolean | null
          is_completed_meal: boolean | null
          is_completed_pilates: boolean | null
          is_completed_yoga: boolean | null
          meal_calories_estimate: number | null
          meal_ingredients: string | null
          meal_instructions: string | null
          meal_title: string | null
          pilates_duration_minutes: number | null
          pilates_exercises_json: Json | null
          pilates_instructions: string | null
          pilates_title: string | null
          plan_date: string
          protein_target_g: number | null
          reps_or_duration: string
          total_exercise_calories: number | null
          user_id: string
          yoga_duration_minutes: number
          yoga_instructions: string | null
          yoga_poses_json: Json | null
          yoga_title: string | null
        }
        Insert: {
          calorie_target?: number | null
          completed_exercise_at?: string | null
          completed_meal_at?: string | null
          completed_pilates_at?: string | null
          completed_yoga_at?: string | null
          created_at?: string
          daily_water_target_liters: number
          exercise_instructions?: string | null
          exercise_title?: string | null
          exercises_json?: Json | null
          id?: string
          is_completed_exercise?: boolean | null
          is_completed_meal?: boolean | null
          is_completed_pilates?: boolean | null
          is_completed_yoga?: boolean | null
          meal_calories_estimate?: number | null
          meal_ingredients?: string | null
          meal_instructions?: string | null
          meal_title?: string | null
          pilates_duration_minutes?: number | null
          pilates_exercises_json?: Json | null
          pilates_instructions?: string | null
          pilates_title?: string | null
          plan_date?: string
          protein_target_g?: number | null
          reps_or_duration: string
          total_exercise_calories?: number | null
          user_id: string
          yoga_duration_minutes: number
          yoga_instructions?: string | null
          yoga_poses_json?: Json | null
          yoga_title?: string | null
        }
        Update: {
          calorie_target?: number | null
          completed_exercise_at?: string | null
          completed_meal_at?: string | null
          completed_pilates_at?: string | null
          completed_yoga_at?: string | null
          created_at?: string
          daily_water_target_liters?: number
          exercise_instructions?: string | null
          exercise_title?: string | null
          exercises_json?: Json | null
          id?: string
          is_completed_exercise?: boolean | null
          is_completed_meal?: boolean | null
          is_completed_pilates?: boolean | null
          is_completed_yoga?: boolean | null
          meal_calories_estimate?: number | null
          meal_ingredients?: string | null
          meal_instructions?: string | null
          meal_title?: string | null
          pilates_duration_minutes?: number | null
          pilates_exercises_json?: Json | null
          pilates_instructions?: string | null
          pilates_title?: string | null
          plan_date?: string
          protein_target_g?: number | null
          reps_or_duration?: string
          total_exercise_calories?: number | null
          user_id?: string
          yoga_duration_minutes?: number
          yoga_instructions?: string | null
          yoga_poses_json?: Json | null
          yoga_title?: string | null
        }
        Relationships: []
      }
      exercises_gym: {
        Row: {
          created_at: string
          equipment_needed: string | null
          id: string
          instructions: string | null
          intensity_level: string | null
          reps_or_duration: string
          title: string
        }
        Insert: {
          created_at?: string
          equipment_needed?: string | null
          id?: string
          instructions?: string | null
          intensity_level?: string | null
          reps_or_duration: string
          title: string
        }
        Update: {
          created_at?: string
          equipment_needed?: string | null
          id?: string
          instructions?: string | null
          intensity_level?: string | null
          reps_or_duration?: string
          title?: string
        }
        Relationships: []
      }
      exercises_home: {
        Row: {
          created_at: string
          id: string
          instructions: string | null
          intensity_level: string | null
          reps_or_duration: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string | null
          intensity_level?: string | null
          reps_or_duration: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string | null
          intensity_level?: string | null
          reps_or_duration?: string
          title?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number | null
          created_at: string
          id: string
          ingredients: string | null
          instructions: string | null
          protein_focused: boolean | null
          title: string
        }
        Insert: {
          calories?: number | null
          created_at?: string
          id?: string
          ingredients?: string | null
          instructions?: string | null
          protein_focused?: boolean | null
          title: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          id?: string
          ingredients?: string | null
          instructions?: string | null
          protein_focused?: boolean | null
          title?: string
        }
        Relationships: []
      }
      pilates_exercises: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          instructions: string | null
          level: string
          title: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          instructions?: string | null
          level: string
          title: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          instructions?: string | null
          level?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          cookie_consent: boolean | null
          cookie_consent_date: string | null
          created_at: string
          current_streak: number | null
          daily_calories: number | null
          data_processing_consent: boolean | null
          gender: string | null
          goal: string | null
          height: number | null
          intensity: string | null
          last_completed_date: string | null
          last_water_update_date: string | null
          longest_streak: number | null
          marketing_consent: boolean | null
          protein_target: number | null
          target_weight_kg: number | null
          total_workouts_completed: number | null
          training_styles: string[] | null
          user_id: string
          water_intake_today: number | null
          weight: number | null
          workout_mode: string | null
        }
        Insert: {
          age?: number | null
          cookie_consent?: boolean | null
          cookie_consent_date?: string | null
          created_at?: string
          current_streak?: number | null
          daily_calories?: number | null
          data_processing_consent?: boolean | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          intensity?: string | null
          last_completed_date?: string | null
          last_water_update_date?: string | null
          longest_streak?: number | null
          marketing_consent?: boolean | null
          protein_target?: number | null
          target_weight_kg?: number | null
          total_workouts_completed?: number | null
          training_styles?: string[] | null
          user_id: string
          water_intake_today?: number | null
          weight?: number | null
          workout_mode?: string | null
        }
        Update: {
          age?: number | null
          cookie_consent?: boolean | null
          cookie_consent_date?: string | null
          created_at?: string
          current_streak?: number | null
          daily_calories?: number | null
          data_processing_consent?: boolean | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          intensity?: string | null
          last_completed_date?: string | null
          last_water_update_date?: string | null
          longest_streak?: number | null
          marketing_consent?: boolean | null
          protein_target?: number | null
          target_weight_kg?: number | null
          total_workouts_completed?: number | null
          training_styles?: string[] | null
          user_id?: string
          water_intake_today?: number | null
          weight?: number | null
          workout_mode?: string | null
        }
        Relationships: []
      }
      workout_history: {
        Row: {
          calories_burned: number | null
          completed_at: string
          created_at: string
          duration_minutes: number | null
          id: string
          plan_date: string
          user_id: string
          workout_type: string
        }
        Insert: {
          calories_burned?: number | null
          completed_at?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          plan_date: string
          user_id: string
          workout_type: string
        }
        Update: {
          calories_burned?: number | null
          completed_at?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          plan_date?: string
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
      yoga_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          instructions: string | null
          intensity_level: string
          title: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          instructions?: string | null
          intensity_level: string
          title: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          instructions?: string | null
          intensity_level?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
