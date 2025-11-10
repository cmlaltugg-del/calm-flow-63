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
      daily_plans: {
        Row: {
          calorie_target: number | null
          created_at: string
          daily_water_target_liters: number
          exercise_instructions: string | null
          exercise_title: string
          id: string
          is_completed_exercise: boolean | null
          is_completed_meal: boolean | null
          is_completed_yoga: boolean | null
          meal_calories_estimate: number | null
          meal_ingredients: string | null
          meal_instructions: string | null
          meal_title: string
          plan_date: string
          protein_target_g: number | null
          reps_or_duration: string
          user_id: string
          yoga_duration_minutes: number
          yoga_instructions: string | null
          yoga_title: string
        }
        Insert: {
          calorie_target?: number | null
          created_at?: string
          daily_water_target_liters: number
          exercise_instructions?: string | null
          exercise_title: string
          id?: string
          is_completed_exercise?: boolean | null
          is_completed_meal?: boolean | null
          is_completed_yoga?: boolean | null
          meal_calories_estimate?: number | null
          meal_ingredients?: string | null
          meal_instructions?: string | null
          meal_title: string
          plan_date?: string
          protein_target_g?: number | null
          reps_or_duration: string
          user_id: string
          yoga_duration_minutes: number
          yoga_instructions?: string | null
          yoga_title: string
        }
        Update: {
          calorie_target?: number | null
          created_at?: string
          daily_water_target_liters?: number
          exercise_instructions?: string | null
          exercise_title?: string
          id?: string
          is_completed_exercise?: boolean | null
          is_completed_meal?: boolean | null
          is_completed_yoga?: boolean | null
          meal_calories_estimate?: number | null
          meal_ingredients?: string | null
          meal_instructions?: string | null
          meal_title?: string
          plan_date?: string
          protein_target_g?: number | null
          reps_or_duration?: string
          user_id?: string
          yoga_duration_minutes?: number
          yoga_instructions?: string | null
          yoga_title?: string
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
      profiles: {
        Row: {
          age: number | null
          created_at: string
          daily_calories: number | null
          gender: string | null
          goal: string | null
          height: number | null
          protein_target: number | null
          target_weight_kg: number | null
          user_id: string
          weight: number | null
          workout_mode: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          daily_calories?: number | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          protein_target?: number | null
          target_weight_kg?: number | null
          user_id: string
          weight?: number | null
          workout_mode?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string
          daily_calories?: number | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          protein_target?: number | null
          target_weight_kg?: number | null
          user_id?: string
          weight?: number | null
          workout_mode?: string | null
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
