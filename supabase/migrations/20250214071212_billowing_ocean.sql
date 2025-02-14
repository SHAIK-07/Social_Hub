/*
  # Enable RLS for storage buckets

  1. Changes
    - Enable RLS for avatars, posts, and videos buckets
    - This must be done before creating policies

  2. Security
    - Enable RLS for all storage buckets
    - This ensures policies will be enforced
*/

-- Enable RLS for storage buckets
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name)
VALUES 
  ('avatars', 'avatars'),
  ('posts', 'posts'),
  ('videos', 'videos')
ON CONFLICT (id) DO NOTHING;