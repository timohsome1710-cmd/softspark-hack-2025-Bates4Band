-- Add is_read column to messages table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'is_read') THEN
        ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;
        CREATE INDEX idx_messages_is_read ON public.messages(is_read) WHERE is_read = false;
    END IF;
END $$;