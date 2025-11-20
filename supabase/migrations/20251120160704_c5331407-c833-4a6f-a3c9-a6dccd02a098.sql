-- Priority 2: Performance - Add plan cache table
CREATE TABLE IF NOT EXISTS plan_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_hash TEXT UNIQUE NOT NULL,
  cached_plan JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hit_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_plan_cache_hash ON plan_cache(profile_hash);

-- Priority 2: Performance - Add database indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date_desc 
ON daily_plans(user_id, plan_date DESC);

CREATE INDEX IF NOT EXISTS idx_workout_history_user_completed 
ON workout_history(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercises_json 
ON daily_plans USING GIN (exercises_json);

CREATE INDEX IF NOT EXISTS idx_yoga_poses_json 
ON daily_plans USING GIN (yoga_poses_json);

CREATE INDEX IF NOT EXISTS idx_pilates_exercises_json 
ON daily_plans USING GIN (pilates_exercises_json);

-- Priority 3: Add CHECK constraints (drop first if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workout_type_check') THEN
    ALTER TABLE workout_history DROP CONSTRAINT workout_type_check;
  END IF;
END $$;

ALTER TABLE workout_history 
ADD CONSTRAINT workout_type_check 
CHECK (workout_type IN ('exercise', 'yoga', 'pilates', 'meal'));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gender_check') THEN
    ALTER TABLE profiles DROP CONSTRAINT gender_check;
  END IF;
END $$;

ALTER TABLE profiles 
ADD CONSTRAINT gender_check 
CHECK (gender IN ('male', 'female', 'other'));

-- Priority 4: Add completion timestamps
ALTER TABLE daily_plans 
ADD COLUMN IF NOT EXISTS completed_exercise_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_yoga_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_pilates_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_meal_at TIMESTAMPTZ;

-- Priority 5: Monetization - Add subscription tiers
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  features JSONB NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO subscription_tiers (name, price_monthly, price_yearly, features) VALUES
('free', 0, 0, '{"daily_plans": 1, "video_guides": false, "analytics": "basic"}'),
('basic', 7.99, 79.99, '{"daily_plans": "unlimited", "video_guides": true, "analytics": "basic"}'),
('premium', 14.99, 149.99, '{"daily_plans": "unlimited", "video_guides": true, "analytics": "advanced", "posture_correction": true}')
ON CONFLICT DO NOTHING;

-- Priority 5: Add subscription columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Priority 6: Add onboarding completion flag
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;