-- Delete test/duplicate questions that appear to be created for testing purposes
DELETE FROM public.questions 
WHERE title IN ('23', 'MATH', 'Solve', 'timotius') 
   OR (title = 'Hardest Math Problem' AND id != '87d99974-4e68-43a7-8f42-301fd4ddfd9d');

-- Also delete any related data
DELETE FROM public.answers WHERE question_id NOT IN (SELECT id FROM public.questions);
DELETE FROM public.answer_comments WHERE answer_id NOT IN (SELECT id FROM public.answers);
DELETE FROM public.question_views WHERE question_id NOT IN (SELECT id FROM public.questions);