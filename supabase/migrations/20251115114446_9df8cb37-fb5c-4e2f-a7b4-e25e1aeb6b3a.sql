-- Priority 1: Security & Compliance Database Changes (Fixed)

-- 1. Create rate limiting table
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index for rate limiting
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_unique 
ON api_rate_limits(user_id, endpoint, window_start);

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint 
ON api_rate_limits(user_id, endpoint, window_start);

-- 2. Add GDPR compliance columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cookie_consent BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cookie_consent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_processing_consent BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;

-- 3. Add completion timestamps to daily_plans for better analytics
ALTER TABLE daily_plans 
ADD COLUMN IF NOT EXISTS completed_exercise_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_yoga_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_pilates_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_meal_at TIMESTAMPTZ;

-- 4. Add database constraints for data integrity
-- Gender check
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gender_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT gender_check 
    CHECK (gender IN ('male', 'female', 'other'));
  END IF;
END $$;

-- Workout type check
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workout_type_check'
  ) THEN
    ALTER TABLE workout_history 
    ADD CONSTRAINT workout_type_check 
    CHECK (workout_type IN ('exercise', 'yoga', 'pilates', 'meal'));
  END IF;
END $$;

-- 5. Add performance indexes
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

-- 6. Create audit log table for GDPR compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON audit_logs(user_id, created_at DESC);