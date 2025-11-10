-- Add daily calorie and protein targets to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_calories INTEGER,
  ADD COLUMN IF NOT EXISTS protein_target INTEGER;