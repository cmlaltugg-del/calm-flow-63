-- Add detailed exercise, yoga and meal tracking to daily_plans
ALTER TABLE public.daily_plans 
ADD COLUMN exercises_json JSONB,
ADD COLUMN total_exercise_calories INTEGER,
ADD COLUMN yoga_poses_json JSONB;

-- Add comment to explain the new columns
COMMENT ON COLUMN public.daily_plans.exercises_json IS 'Array of 5 exercises with title, instructions, reps, and calories each';
COMMENT ON COLUMN public.daily_plans.total_exercise_calories IS 'Total calories burned from all exercises';
COMMENT ON COLUMN public.daily_plans.yoga_poses_json IS 'Array of yoga poses with name and instructions';
