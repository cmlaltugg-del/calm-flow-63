-- Make exercise, yoga, and meal fields nullable in daily_plans
-- This allows users with different training_styles combinations to have valid plans

ALTER TABLE public.daily_plans 
  ALTER COLUMN exercise_title DROP NOT NULL,
  ALTER COLUMN yoga_title DROP NOT NULL,
  ALTER COLUMN meal_title DROP NOT NULL;