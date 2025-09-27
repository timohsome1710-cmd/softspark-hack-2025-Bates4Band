-- Only add the missing foreign key constraint for answer_comments.author_id -> profiles.id
ALTER TABLE public.answer_comments 
ADD CONSTRAINT answer_comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;