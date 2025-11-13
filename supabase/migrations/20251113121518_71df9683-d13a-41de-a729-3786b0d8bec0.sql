-- Add water tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN water_intake_today NUMERIC DEFAULT 0,
ADD COLUMN last_water_update_date DATE DEFAULT CURRENT_DATE;

-- Add comment for clarity
COMMENT ON COLUMN profiles.water_intake_today IS 'Current water intake in liters for today';
COMMENT ON COLUMN profiles.last_water_update_date IS 'Date when water intake was last updated - used to reset daily';