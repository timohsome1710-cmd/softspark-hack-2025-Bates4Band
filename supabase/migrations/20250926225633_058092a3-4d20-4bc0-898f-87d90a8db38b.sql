-- First, let's ensure we have proper authentication setup and create necessary functions

-- Create or update profiles table with complete user information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semester INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year INTEGER; 
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS major TEXT;

-- Ensure user stats table has all required fields
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS questions_asked INTEGER DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS total_exp INTEGER DEFAULT 0;

-- Update the user creation trigger to ensure proper profile setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'user'::app_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);
  
  -- Insert into user_stats
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create some test users with proper authentication setup
-- Note: These should be created through Supabase Auth, but we'll ensure their profiles exist

-- Function to get statistics for homepage
CREATE OR REPLACE FUNCTION public.get_homepage_stats()
RETURNS TABLE (
  active_students bigint,
  questions_solved bigint,
  this_week_questions bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(DISTINCT p.id) as active_students,
    COUNT(DISTINCT CASE WHEN a.approved_by_author = true THEN a.id END) as questions_solved,
    COUNT(DISTINCT CASE WHEN q.created_at >= date_trunc('week', now()) THEN q.id END) as this_week_questions
  FROM profiles p
  LEFT JOIN user_stats us ON p.id = us.user_id
  LEFT JOIN answers a ON p.id = a.author_id
  LEFT JOIN questions q ON p.id = q.author_id;
$$;

-- Fix friends table RLS policies
DROP POLICY IF EXISTS "Users can update friend requests" ON public.friends;
CREATE POLICY "Users can update friend requests" 
ON public.friends 
FOR UPDATE 
USING (auth.uid() = friend_id OR auth.uid() = user_id)
WITH CHECK (
  (auth.uid() = friend_id AND status IN ('accepted', 'declined')) OR
  (auth.uid() = user_id)
);

-- Create policy for accepting friend requests
CREATE POLICY "Users can accept friend requests" 
ON public.friends 
FOR UPDATE 
USING (auth.uid() = friend_id AND status = 'pending')
WITH CHECK (auth.uid() = friend_id AND status = 'accepted');

-- Reset season to 1 and set proper dates
UPDATE seasons SET is_active = false;
INSERT INTO seasons (season_number, start_date, end_date, is_active)
VALUES (1, now(), '2025-11-01'::timestamp with time zone, true)
ON CONFLICT DO NOTHING;

-- Reset all user stats for season 1
UPDATE user_stats SET
  seasonal_exp = 0,
  season = 1,
  trophy_rank = 'bronze'::trophy_rank;