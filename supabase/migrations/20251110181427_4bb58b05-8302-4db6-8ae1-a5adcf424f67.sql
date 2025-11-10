-- Add missing columns to support bulk import
ALTER TABLE public.exercises_gym
ADD COLUMN IF NOT EXISTS equipment_needed TEXT;

ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS ingredients TEXT;