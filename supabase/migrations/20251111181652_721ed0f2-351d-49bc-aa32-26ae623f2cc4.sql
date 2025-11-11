-- Create pilates_exercises table
CREATE TABLE public.pilates_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  instructions TEXT,
  duration_minutes INTEGER NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pilates_exercises ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing pilates exercises
CREATE POLICY "Anyone can view pilates exercises" 
ON public.pilates_exercises 
FOR SELECT 
USING (true);

-- Insert sample pilates exercises
INSERT INTO public.pilates_exercises (title, instructions, duration_minutes, level) VALUES
('The Hundred', 'Lie on your back with knees bent. Lift head and shoulders, extend arms. Pump arms up and down while breathing in for 5 counts and out for 5 counts. Repeat 10 times.', 5, 'beginner'),
('Roll Up', 'Lie flat, arms overhead. Slowly roll up to sitting position, reaching for toes. Roll back down with control.', 3, 'intermediate'),
('Single Leg Circle', 'Lie on back, one leg extended to ceiling. Draw circles with leg while keeping hips stable.', 4, 'beginner'),
('Rolling Like a Ball', 'Sit balanced on tailbone, knees to chest. Roll back to shoulders, then roll back up to starting position.', 3, 'beginner'),
('Single Leg Stretch', 'Lie on back, head lifted. Pull one knee to chest while extending other leg. Alternate legs in a smooth rhythm.', 5, 'intermediate'),
('Double Leg Stretch', 'Lie on back, knees to chest. Extend arms and legs, then circle arms back while pulling knees in.', 4, 'intermediate'),
('Spine Stretch Forward', 'Sit tall with legs extended. Reach forward, rounding spine while maintaining core engagement.', 3, 'beginner'),
('Swan Dive', 'Lie on stomach, hands under shoulders. Lift upper body, then rock forward and back in a controlled motion.', 4, 'advanced'),
('Side Kick Series', 'Lie on side, legs slightly forward. Lift top leg and kick forward and back with control.', 6, 'intermediate'),
('Teaser', 'Lie on back, roll up to V-position balancing on tailbone with arms and legs extended. Hold and lower with control.', 5, 'advanced');