-- Add completion tracking columns to daily_plans
ALTER TABLE public.daily_plans
ADD COLUMN is_completed_exercise BOOLEAN DEFAULT FALSE,
ADD COLUMN is_completed_yoga BOOLEAN DEFAULT FALSE,
ADD COLUMN is_completed_meal BOOLEAN DEFAULT FALSE;

-- Add optional fields for meal details
ALTER TABLE public.daily_plans
ADD COLUMN meal_ingredients TEXT,
ADD COLUMN meal_calories_estimate INTEGER;