-- Add badge tracking fields to questions table
ALTER TABLE public.questions 
ADD COLUMN has_approved_answer boolean DEFAULT false,
ADD COLUMN has_teacher_approved_answer boolean DEFAULT false;

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

-- Enable realtime for questions table
ALTER TABLE public.questions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;