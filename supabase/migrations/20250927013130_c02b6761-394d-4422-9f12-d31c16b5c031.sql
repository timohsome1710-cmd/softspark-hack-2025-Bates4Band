-- Add view tracking table for unique user views
CREATE TABLE IF NOT EXISTS public.question_views (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL,
    viewer_id UUID NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(question_id, viewer_id)
);

-- Enable RLS on question_views
ALTER TABLE public.question_views ENABLE ROW LEVEL SECURITY;

-- Create policies for question_views
CREATE POLICY "Users can view their own views" ON public.question_views
FOR SELECT USING (auth.uid() = viewer_id);

CREATE POLICY "Users can track their views" ON public.question_views
FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Add view_count column to questions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'questions' AND column_name = 'view_count') THEN
        ALTER TABLE public.questions ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Create function to increment unique view count
CREATE OR REPLACE FUNCTION public.increment_question_view(question_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert view record if not exists (will be ignored if duplicate due to unique constraint)
  INSERT INTO public.question_views (question_id, viewer_id)
  VALUES (question_id, auth.uid())
  ON CONFLICT (question_id, viewer_id) DO NOTHING;
  
  -- Update view count based on unique viewers
  UPDATE public.questions 
  SET view_count = (
    SELECT COUNT(*) 
    FROM public.question_views 
    WHERE question_views.question_id = questions.id
  )
  WHERE questions.id = question_id;
END;
$$;