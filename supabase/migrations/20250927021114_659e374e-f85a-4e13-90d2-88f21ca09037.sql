-- Enable realtime for answers table to get real-time updates
ALTER TABLE public.answers REPLICA IDENTITY FULL;