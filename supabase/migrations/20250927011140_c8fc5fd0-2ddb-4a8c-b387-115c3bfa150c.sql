-- Standardize category names for consistency
UPDATE public.questions SET category = 'Mathematics' WHERE category ILIKE '%math%';
UPDATE public.questions SET category = 'Science' WHERE category ILIKE '%science%';
UPDATE public.questions SET category = 'Social Studies' WHERE category ILIKE '%social%' OR category ILIKE '%studies%';