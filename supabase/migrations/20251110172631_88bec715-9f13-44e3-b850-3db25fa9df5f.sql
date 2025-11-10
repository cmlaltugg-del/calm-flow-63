-- Create yoga_sessions table
CREATE TABLE public.yoga_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  instructions TEXT,
  duration_minutes INTEGER NOT NULL,
  intensity_level TEXT NOT NULL CHECK (intensity_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.yoga_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Anyone can view yoga sessions"
ON public.yoga_sessions
FOR SELECT
USING (true);

-- Insert sample yoga sessions
INSERT INTO public.yoga_sessions (title, instructions, duration_minutes, intensity_level) VALUES
('Morning Sun Salutation', 'Start your day with energizing sun salutations', 10, 'medium'),
('Gentle Stretch Flow', 'Gentle stretches for relaxation', 8, 'low'),
('Relax & Unwind', 'Evening relaxation and stress relief', 12, 'low'),
('Power Yoga Flow', 'Build strength and flexibility', 20, 'high'),
('Bedtime Wind Down', 'Calming poses for better sleep', 10, 'low'),
('Core & Balance', 'Strengthen your core and improve balance', 15, 'medium');