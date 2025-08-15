-- Create friends table for Chat2Chat-Web
CREATE TABLE public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  friend_user_id UUID NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  friend_display_name TEXT NOT NULL, -- Cache friend's display name
  friend_unique_id TEXT NOT NULL, -- Cache friend's unique ID
  nickname TEXT, -- Custom nickname for this friend
  status TEXT NOT NULL DEFAULT 'friends' CHECK (status IN ('friends', 'blocked', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Create policies for friends access
CREATE POLICY "Users can view their own friends" 
ON public.friends 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.chat_users WHERE unique_id = (
    SELECT unique_id FROM public.chat_users WHERE id = auth.uid()
  )
));

CREATE POLICY "Users can manage their own friends" 
ON public.friends 
FOR ALL
USING (user_id IN (
  SELECT id FROM public.chat_users WHERE unique_id = (
    SELECT unique_id FROM public.chat_users WHERE id = auth.uid()
  )
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_friends_updated_at
    BEFORE UPDATE ON public.friends
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_friends_user_id ON public.friends(user_id);
CREATE INDEX idx_friends_friend_user_id ON public.friends(friend_user_id);
CREATE INDEX idx_friends_status ON public.friends(status);