-- Update season end date to be 89 days from Sept 27, 2025
UPDATE seasons SET 
  start_date = '2025-09-27'::timestamp with time zone,
  end_date = '2025-12-25'::timestamp with time zone
WHERE is_active = true;

-- Reset all seasonal EXP to 0 for new season start
UPDATE user_stats SET 
  seasonal_exp = 0,
  trophy_rank = 'bronze'::trophy_rank;