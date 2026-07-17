-- Add preferences column to profiles for storing user settings (theme, etc.)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
