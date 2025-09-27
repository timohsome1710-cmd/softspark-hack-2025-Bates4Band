-- Reset all EXP values now
BEGIN;
UPDATE public.user_stats
  SET seasonal_exp = 0,
      total_exp = 0,
      trophy_rank = 'bronze';
COMMIT;