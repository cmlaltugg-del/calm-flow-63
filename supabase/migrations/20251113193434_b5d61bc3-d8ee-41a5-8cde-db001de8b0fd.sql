-- Create public storage bucket for workout GIFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-gifs',
  'workout-gifs',
  true,
  10485760, -- 10MB limit per file
  ARRAY['image/gif']
);

-- Create RLS policies for public read access
CREATE POLICY "Public Access for workout GIFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'workout-gifs');

-- Allow authenticated users to upload GIFs (for admin purposes)
CREATE POLICY "Authenticated users can upload workout GIFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workout-gifs' 
  AND auth.role() = 'authenticated'
);