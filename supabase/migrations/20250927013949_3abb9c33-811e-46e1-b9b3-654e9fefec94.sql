-- 1) Read receipts table for per-user read state
CREATE TABLE IF NOT EXISTS public.message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Policies: users can insert/select their own receipts
CREATE POLICY "Users can view their own receipts"
ON public.message_read_receipts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts"
ON public.message_read_receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_receipts_message ON public.message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON public.message_read_receipts(user_id);

-- 2) Function to compute unread count for current user
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.messages m
  WHERE m.sender_id <> auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.message_read_receipts r
      WHERE r.message_id = m.id AND r.user_id = auth.uid()
    );
$$;