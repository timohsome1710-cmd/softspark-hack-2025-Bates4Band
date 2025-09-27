-- Create function to award EXP to users
CREATE OR REPLACE FUNCTION public.award_user_exp(p_user_id UUID, p_exp_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update user stats with new EXP
  UPDATE user_stats 
  SET 
    exp_points = exp_points + p_exp_amount,
    seasonal_exp = seasonal_exp + p_exp_amount,
    total_exp = COALESCE(total_exp, 0) + p_exp_amount,
    level = calculate_level_from_total_exp(COALESCE(total_exp, 0) + p_exp_amount),
    trophy_rank = get_trophy_rank_from_exp(seasonal_exp + p_exp_amount),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_stats (
      user_id, 
      exp_points, 
      seasonal_exp, 
      total_exp, 
      level, 
      trophy_rank
    ) VALUES (
      p_user_id, 
      p_exp_amount, 
      p_exp_amount, 
      p_exp_amount,
      calculate_level_from_total_exp(p_exp_amount),
      get_trophy_rank_from_exp(p_exp_amount)
    );
  END IF;
END;
$$;

-- Create function to calculate level from total EXP
CREATE OR REPLACE FUNCTION public.calculate_level_from_total_exp(total_exp INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(1, FLOOR(SQRT(total_exp / 100.0))::INTEGER + 1);
$$;

-- Update the reset_season function to handle trophy demotion properly
CREATE OR REPLACE FUNCTION public.reset_season()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_season_num INTEGER;
  new_season_num INTEGER;
BEGIN
  -- Get current season number
  SELECT season_number INTO current_season_num 
  FROM seasons 
  WHERE is_active = true 
  LIMIT 1;
  
  -- Calculate new season number
  new_season_num := COALESCE(current_season_num, 0) + 1;
  
  -- Deactivate current season
  UPDATE seasons SET is_active = false WHERE is_active = true;
  
  -- Create new season
  INSERT INTO seasons (season_number, start_date, end_date, is_active)
  VALUES (new_season_num, now(), now() + INTERVAL '90 days', true);
  
  -- Reset seasonal EXP and demote trophy ranks
  UPDATE user_stats SET
    seasonal_exp = 0,
    season = new_season_num,
    trophy_rank = demote_trophy_rank(trophy_rank),
    updated_at = now();
END;
$$;

-- Function to get trophy rank display info
CREATE OR REPLACE FUNCTION public.get_trophy_display(rank trophy_rank)
RETURNS TABLE(name TEXT, color TEXT, next_threshold INTEGER)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE rank
    WHEN 'bronze' THEN 'Bronze'
    WHEN 'silver' THEN 'Silver' 
    WHEN 'gold' THEN 'Gold'
    WHEN 'platinum' THEN 'Platinum'
    WHEN 'diamond' THEN 'Diamond'
    WHEN 'radiant' THEN 'Radiant'
  END as name,
  CASE rank
    WHEN 'bronze' THEN '#CD7F32'
    WHEN 'silver' THEN '#C0C0C0'
    WHEN 'gold' THEN '#FFD700'
    WHEN 'platinum' THEN '#E5E4E2'
    WHEN 'diamond' THEN '#B9F2FF'
    WHEN 'radiant' THEN '#FF6B9D'
  END as color,
  get_next_trophy_threshold(rank) as next_threshold;
$$;