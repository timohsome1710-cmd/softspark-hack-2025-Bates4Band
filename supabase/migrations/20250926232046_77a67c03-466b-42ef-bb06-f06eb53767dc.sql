-- Enable RLS on messages table for proper access control
CREATE POLICY "Chat room members can view messages" 
ON public.messages 
FOR SELECT 
USING (is_chat_room_member(chat_room_id, auth.uid()));

CREATE POLICY "Chat room members can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (is_chat_room_member(chat_room_id, auth.uid()) AND auth.uid() = sender_id);

-- Create friend search function
CREATE OR REPLACE FUNCTION public.search_users_by_name(search_term text)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  is_friend boolean,
  friend_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    CASE 
      WHEN f.id IS NOT NULL THEN true 
      ELSE false 
    END as is_friend,
    COALESCE(f.status, 'none') as friend_status
  FROM profiles p
  LEFT JOIN friends f ON (
    (f.user_id = auth.uid() AND f.friend_id = p.id) OR
    (f.friend_id = auth.uid() AND f.user_id = p.id)
  )
  WHERE 
    p.id != auth.uid() AND
    p.display_name ILIKE '%' || search_term || '%'
  ORDER BY p.display_name
  LIMIT 20;
$$;

-- Create function to get user's friends list
CREATE OR REPLACE FUNCTION public.get_user_friends()
RETURNS TABLE(
  friend_id uuid,
  display_name text,
  avatar_url text,
  status text,
  last_active timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN f.user_id = auth.uid() THEN f.friend_id
      ELSE f.user_id
    END as friend_id,
    p.display_name,
    p.avatar_url,
    f.status,
    p.updated_at as last_active
  FROM friends f
  JOIN profiles p ON (
    p.id = CASE 
      WHEN f.user_id = auth.uid() THEN f.friend_id
      ELSE f.user_id
    END
  )
  WHERE 
    (f.user_id = auth.uid() OR f.friend_id = auth.uid()) AND
    f.status = 'accepted'
  ORDER BY p.updated_at DESC;
$$;