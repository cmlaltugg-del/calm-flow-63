-- Drop existing primary key and add user_id as primary key
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS id;
ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);