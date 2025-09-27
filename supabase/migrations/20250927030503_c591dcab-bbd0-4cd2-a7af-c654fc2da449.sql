-- Create function to update question badges when answers change
CREATE OR REPLACE FUNCTION public.update_question_badges()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the question's badge status based on approved answers
  UPDATE public.questions 
  SET 
    has_approved_answer = EXISTS (
      SELECT 1 FROM public.answers 
      WHERE question_id = COALESCE(NEW.question_id, OLD.question_id) 
      AND approved_by_author = true
    ),
    has_teacher_approved_answer = EXISTS (
      SELECT 1 FROM public.answers 
      WHERE question_id = COALESCE(NEW.question_id, OLD.question_id) 
      AND teacher_approved = true
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.question_id, OLD.question_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_question_badges_on_answer_insert ON public.answers;
DROP TRIGGER IF EXISTS update_question_badges_on_answer_update ON public.answers;
DROP TRIGGER IF EXISTS update_question_badges_on_answer_delete ON public.answers;

-- Create triggers to update badges when answers are inserted, updated, or deleted
CREATE TRIGGER update_question_badges_on_answer_insert
  AFTER INSERT ON public.answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_question_badges();

CREATE TRIGGER update_question_badges_on_answer_update
  AFTER UPDATE ON public.answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_question_badges();

CREATE TRIGGER update_question_badges_on_answer_delete
  AFTER DELETE ON public.answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_question_badges();

-- Update existing questions to set correct badge status
UPDATE public.questions 
SET 
  has_approved_answer = EXISTS (
    SELECT 1 FROM public.answers 
    WHERE question_id = questions.id 
    AND approved_by_author = true
  ),
  has_teacher_approved_answer = EXISTS (
    SELECT 1 FROM public.answers 
    WHERE question_id = questions.id 
    AND teacher_approved = true
  );