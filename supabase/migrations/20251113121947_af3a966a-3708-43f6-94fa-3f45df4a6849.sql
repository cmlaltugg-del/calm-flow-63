-- Add gamification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_completed_date DATE,
ADD COLUMN IF NOT EXISTS total_workouts_completed INTEGER DEFAULT 0;

-- Create workout_history table
CREATE TABLE IF NOT EXISTS public.workout_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_type TEXT NOT NULL, -- 'exercise', 'yoga', 'pilates'
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  calories_burned INTEGER,
  duration_minutes INTEGER,
  plan_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on workout_history
ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_history
CREATE POLICY "Users can view their own workout history"
ON public.workout_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout history"
ON public.workout_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_history_user_date 
ON public.workout_history(user_id, completed_at DESC);

-- Function to update streak when workout is completed
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  yesterday DATE;
BEGIN
  -- Get user's current profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE user_id = NEW.user_id;

  yesterday := CURRENT_DATE - INTERVAL '1 day';

  -- Update streak logic
  IF user_profile.last_completed_date IS NULL THEN
    -- First workout ever
    UPDATE profiles
    SET current_streak = 1,
        longest_streak = GREATEST(longest_streak, 1),
        last_completed_date = CURRENT_DATE,
        total_workouts_completed = total_workouts_completed + 1
    WHERE user_id = NEW.user_id;
  ELSIF user_profile.last_completed_date = CURRENT_DATE THEN
    -- Already completed today, just increment total
    UPDATE profiles
    SET total_workouts_completed = total_workouts_completed + 1
    WHERE user_id = NEW.user_id;
  ELSIF user_profile.last_completed_date = yesterday THEN
    -- Completed yesterday, continue streak
    UPDATE profiles
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_completed_date = CURRENT_DATE,
        total_workouts_completed = total_workouts_completed + 1
    WHERE user_id = NEW.user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE profiles
    SET current_streak = 1,
        longest_streak = GREATEST(longest_streak, 1),
        last_completed_date = CURRENT_DATE,
        total_workouts_completed = total_workouts_completed + 1
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for streak updates
DROP TRIGGER IF EXISTS on_workout_completed ON public.workout_history;
CREATE TRIGGER on_workout_completed
  AFTER INSERT ON public.workout_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_streak();