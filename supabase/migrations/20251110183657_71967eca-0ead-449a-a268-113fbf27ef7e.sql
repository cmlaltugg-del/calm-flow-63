-- Add target_weight_kg to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add calorie and protein targets to daily_plans table
ALTER TABLE public.daily_plans
  ADD COLUMN IF NOT EXISTS calorie_target INTEGER,
  ADD COLUMN IF NOT EXISTS protein_target_g INTEGER;