-- Enable leaked password protection for better security
-- This setting helps prevent users from using compromised passwords
-- Note: This is a configuration change, not a schema change
-- The linter warning should be resolved through the Supabase dashboard
-- We cannot fix this via SQL migration as it's an auth configuration setting

-- However, we can proceed with the application implementation since the core migration was successful