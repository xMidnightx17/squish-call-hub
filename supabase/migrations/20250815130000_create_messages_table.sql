-- Create messages table for real-time chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, recipient_id, created_at);

-- Enable Row Level Security (but make it permissive for now)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for messages (fix this later with proper auth)
CREATE POLICY "Allow all message operations" 
ON public.messages 
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function for message updates
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get conversation messages
CREATE OR REPLACE FUNCTION get_conversation_messages(user1_id UUID, user2_id UUID, message_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    recipient_id UUID,
    content TEXT,
    message_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN,
    is_edited BOOLEAN,
    sender_display_name TEXT
) 
LANGUAGE SQL
AS $$
  SELECT 
    m.id,
    m.sender_id,
    m.recipient_id,
    m.content,
    m.message_type,
    m.created_at,
    m.is_read,
    m.is_edited,
    u.display_name as sender_display_name
  FROM public.messages m
  JOIN public.chat_users u ON m.sender_id = u.id
  WHERE 
    (m.sender_id = user1_id AND m.recipient_id = user2_id) OR
    (m.sender_id = user2_id AND m.recipient_id = user1_id)
  ORDER BY m.created_at ASC
  LIMIT message_limit;
$$;
