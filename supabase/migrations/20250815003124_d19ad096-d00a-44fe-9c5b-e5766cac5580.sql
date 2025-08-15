-- Create users table for Chat2Chat-Web authentication
CREATE TABLE public.chat_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL UNIQUE,
  unique_id TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_users ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view all profiles" 
ON public.chat_users 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own profile" 
ON public.chat_users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
ON public.chat_users 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chat_users_updated_at
    BEFORE UPDATE ON public.chat_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_chat_users_display_name ON public.chat_users(display_name);
CREATE INDEX idx_chat_users_unique_id ON public.chat_users(unique_id);