-- Add columns to existing profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='height') THEN
    ALTER TABLE public.profiles ADD COLUMN height DECIMAL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='weight') THEN
    ALTER TABLE public.profiles ADD COLUMN weight DECIMAL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='goal') THEN
    ALTER TABLE public.profiles ADD COLUMN goal TEXT CHECK (goal IN ('lose_weight', 'gain_muscle', 'maintain'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='workout_mode') THEN
    ALTER TABLE public.profiles ADD COLUMN workout_mode TEXT CHECK (workout_mode IN ('home', 'gym'));
  END IF;
END $$;

-- Create exercises_home table
CREATE TABLE IF NOT EXISTS public.exercises_home (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructions TEXT,
  reps_or_duration TEXT NOT NULL,
  intensity_level TEXT CHECK (intensity_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises_home ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercises_home' AND policyname='Anyone can view home exercises') THEN
    CREATE POLICY "Anyone can view home exercises"
    ON public.exercises_home FOR SELECT
    USING (true);
  END IF;
END $$;

-- Insert sample home exercises only if table is empty
INSERT INTO public.exercises_home (title, instructions, reps_or_duration, intensity_level)
SELECT * FROM (VALUES
  ('Bodyweight Squats', 'Stand with feet shoulder-width apart, lower into squat position', '3 sets of 15 reps', 'medium'),
  ('Push-ups', 'Keep body straight, lower chest to ground and push back up', '3 sets of 12 reps', 'medium'),
  ('Plank Hold', 'Hold plank position with straight body', '3 sets of 45 seconds', 'medium'),
  ('Lunges', 'Step forward and lower body until both knees bent at 90 degrees', '3 sets of 10 per leg', 'medium'),
  ('Mountain Climbers', 'Start in plank, alternate bringing knees to chest quickly', '3 sets of 30 seconds', 'high'),
  ('Jumping Jacks', 'Full body cardio movement', '3 sets of 30 reps', 'low')
) AS v(title, instructions, reps_or_duration, intensity_level)
WHERE NOT EXISTS (SELECT 1 FROM public.exercises_home LIMIT 1);

-- Create exercises_gym table
CREATE TABLE IF NOT EXISTS public.exercises_gym (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructions TEXT,
  reps_or_duration TEXT NOT NULL,
  intensity_level TEXT CHECK (intensity_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises_gym ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercises_gym' AND policyname='Anyone can view gym exercises') THEN
    CREATE POLICY "Anyone can view gym exercises"
    ON public.exercises_gym FOR SELECT
    USING (true);
  END IF;
END $$;

-- Insert sample gym exercises
INSERT INTO public.exercises_gym (title, instructions, reps_or_duration, intensity_level)
SELECT * FROM (VALUES
  ('Barbell Squats', 'Position barbell on upper back, squat down keeping back straight', '4 sets of 8-10 reps', 'high'),
  ('Bench Press', 'Lie on bench, lower bar to chest and press up', '4 sets of 8-10 reps', 'high'),
  ('Deadlifts', 'Lift barbell from ground to standing position with straight back', '3 sets of 6-8 reps', 'high'),
  ('Lat Pulldowns', 'Pull bar down to chest while seated', '3 sets of 12 reps', 'medium'),
  ('Dumbbell Rows', 'Bend at waist, pull dumbbell to hip', '3 sets of 10 per arm', 'medium'),
  ('Cable Flyes', 'Cross cables in front of chest', '3 sets of 12 reps', 'medium')
) AS v(title, instructions, reps_or_duration, intensity_level)
WHERE NOT EXISTS (SELECT 1 FROM public.exercises_gym LIMIT 1);

-- Create meals table
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructions TEXT,
  protein_focused BOOLEAN DEFAULT false,
  calories INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='meals' AND policyname='Anyone can view meals') THEN
    CREATE POLICY "Anyone can view meals"
    ON public.meals FOR SELECT
    USING (true);
  END IF;
END $$;

-- Insert sample meals
INSERT INTO public.meals (title, instructions, protein_focused, calories)
SELECT * FROM (VALUES
  ('Grilled Chicken Bowl', 'Grilled chicken breast with quinoa, roasted vegetables, and tahini dressing', true, 450),
  ('Salmon & Sweet Potato', 'Baked salmon fillet with roasted sweet potato and steamed broccoli', true, 520),
  ('Protein Smoothie Bowl', 'Blend protein powder, banana, berries, top with granola and nuts', true, 380),
  ('Mediterranean Salad', 'Mixed greens, chickpeas, cucumber, tomatoes, feta, olive oil dressing', false, 320),
  ('Veggie Stir Fry', 'Mixed vegetables with tofu, brown rice, and soy-ginger sauce', false, 400),
  ('Turkey & Avocado Wrap', 'Whole wheat wrap with turkey, avocado, lettuce, and hummus', true, 420)
) AS v(title, instructions, protein_focused, calories)
WHERE NOT EXISTS (SELECT 1 FROM public.meals LIMIT 1);

-- Create daily_plans table
CREATE TABLE IF NOT EXISTS public.daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exercise_title TEXT NOT NULL,
  exercise_instructions TEXT,
  reps_or_duration TEXT NOT NULL,
  meal_title TEXT NOT NULL,
  meal_instructions TEXT,
  yoga_title TEXT NOT NULL,
  yoga_instructions TEXT,
  yoga_duration_minutes INTEGER NOT NULL,
  daily_water_target_liters DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_date)
);

ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_plans' AND policyname='Users can view their own daily plans') THEN
    CREATE POLICY "Users can view their own daily plans"
    ON public.daily_plans FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_plans' AND policyname='Users can insert their own daily plans') THEN
    CREATE POLICY "Users can insert their own daily plans"
    ON public.daily_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_plans' AND policyname='Users can update their own daily plans') THEN
    CREATE POLICY "Users can update their own daily plans"
    ON public.daily_plans FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;