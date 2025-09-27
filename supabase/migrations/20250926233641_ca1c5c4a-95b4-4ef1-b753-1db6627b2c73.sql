-- Fix the foreign key relationship issues and ensure proper data structure
-- Add foreign key constraint if missing
DO $$
BEGIN
    -- Check if foreign key exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_stats_user_id_fkey' 
        AND table_name = 'user_stats'
    ) THEN
        ALTER TABLE user_stats 
        ADD CONSTRAINT user_stats_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;