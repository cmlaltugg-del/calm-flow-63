-- Add pilates columns to daily_plans table
ALTER TABLE public.daily_plans 
  ADD COLUMN pilates_title text,
  ADD COLUMN pilates_instructions text,
  ADD COLUMN pilates_duration_minutes integer,
  ADD COLUMN pilates_exercises_json jsonb,
  ADD COLUMN is_completed_pilates boolean DEFAULT false;