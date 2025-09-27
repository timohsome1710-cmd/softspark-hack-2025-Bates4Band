-- Fix the unread message count function to properly count per user
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::int
  FROM public.messages m
  JOIN public.chat_rooms cr ON m.chat_room_id = cr.id
  WHERE m.sender_id <> auth.uid()
    AND (
      -- Direct chats where user is participant
      (NOT cr.is_group AND (cr.user1_id = auth.uid() OR cr.user2_id = auth.uid()))
      OR
      -- Group chats where user is member
      (cr.is_group AND is_chat_room_member(cr.id, auth.uid()))
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.message_read_receipts r
      WHERE r.message_id = m.id AND r.user_id = auth.uid()
    );
$function$;