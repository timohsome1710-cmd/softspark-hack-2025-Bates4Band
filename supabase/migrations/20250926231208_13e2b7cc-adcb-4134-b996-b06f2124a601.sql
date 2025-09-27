-- Fix chat_rooms table to remove foreign key constraints and use direct UUID references
-- This resolves the PGRST200 error about missing foreign key relationships

-- Drop and recreate chat_rooms table with proper structure
DROP TABLE IF EXISTS public.chat_rooms CASCADE;

CREATE TABLE public.chat_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_group boolean NOT NULL DEFAULT false,
  group_name text,
  user1_id uuid,
  user2_id uuid,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_rooms
CREATE POLICY "Users can create direct chats" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK ((NOT is_group) AND ((user1_id = auth.uid()) OR (user2_id = auth.uid())));

CREATE POLICY "Users can create group chats" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK (is_group AND (created_by = auth.uid()));

CREATE POLICY "Users can view their direct chats" 
ON public.chat_rooms 
FOR SELECT 
USING ((NOT is_group) AND ((user1_id = auth.uid()) OR (user2_id = auth.uid())));

CREATE POLICY "Users can view their group chats" 
ON public.chat_rooms 
FOR SELECT 
USING (is_group AND ((created_by = auth.uid()) OR is_chat_room_member(id, auth.uid())));

-- Add trigger for timestamps
CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add media support to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS media_files text[],
ADD COLUMN IF NOT EXISTS media_types text[];

-- Add profile avatar upload support
CREATE OR REPLACE FUNCTION public.handle_avatar_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the avatar_url in profiles when a file is uploaded to profile-avatars bucket
  UPDATE public.profiles 
  SET avatar_url = NEW.name 
  WHERE id = auth.uid();
  
  RETURN NEW;
END;
$$;