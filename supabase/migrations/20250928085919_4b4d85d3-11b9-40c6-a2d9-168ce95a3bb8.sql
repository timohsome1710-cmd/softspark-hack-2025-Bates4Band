-- Update the award_user_exp function to properly handle question submission EXP
CREATE OR REPLACE FUNCTION public.award_question_exp(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Award 50 EXP for asking a question
  PERFORM award_user_exp(p_user_id, 50);
END;
$function$;