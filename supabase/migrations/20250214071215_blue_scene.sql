/*
  # Update storage policies

  1. Changes
    - Drop existing policies
    - Create new policies with correct syntax
    - Add public access policies
    - Add user-specific upload policies

  2. Security
    - Enable public read access to all files
    - Restrict write access to authenticated users
    - Ensure users can only manage their own files
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- Create new policies with correct syntax
CREATE POLICY "Give users access to own folder" ON storage.objects
FOR ALL USING (
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (
  bucket_id IN ('avatars', 'posts', 'videos')
);

CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id IN ('avatars', 'posts', 'videos') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to update own files" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id IN ('avatars', 'posts', 'videos') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id IN ('avatars', 'posts', 'videos') AND
  auth.uid()::text = (storage.foldername(name))[1]
);