-- Create user presence table for online/offline status
CREATE TABLE public.user_presence (
  user_id UUID NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy')),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for user presence
CREATE POLICY "Allow all user_presence operations" 
ON public.user_presence 
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_presence_updated_at
    BEFORE UPDATE ON public.user_presence
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_presence_status ON public.user_presence(status);
CREATE INDEX idx_user_presence_last_seen ON public.user_presence(last_seen);

-- Function to update user status
CREATE OR REPLACE FUNCTION update_user_status(p_user_id UUID, p_status TEXT)
RETURNS void
LANGUAGE SQL
AS $$
  INSERT INTO public.user_presence (user_id, status, last_seen, updated_at)
  VALUES (p_user_id, p_status, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    status = p_status,
    last_seen = now(),
    updated_at = now();
$$;
