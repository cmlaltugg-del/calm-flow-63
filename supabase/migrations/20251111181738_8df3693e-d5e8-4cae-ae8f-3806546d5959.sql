-- Add training_styles and intensity columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN training_styles TEXT[] DEFAULT '{}',
ADD COLUMN intensity TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.training_styles IS 'Array of selected training styles: gym, pilates, yoga';
COMMENT ON COLUMN public.profiles.intensity IS 'Intensity level for non-gym users: low, medium, high';