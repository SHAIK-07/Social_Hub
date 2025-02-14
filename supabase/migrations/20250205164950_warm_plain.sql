/*
  # Combined Migration for Social Platform

  1. Initial Schema Setup
  2. Fix Foreign Key Relationships
  3. Add Followers and Polls Features
  4. Final Foreign Key Fixes
  5. Security & RLS Policies
  6. Insert Default Data
*/

-- =====================
-- 1. Create Tables
-- =====================
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  full_name TEXT,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now()
);


CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  user_id uuid NOT NULL,
  category_id uuid REFERENCES categories NOT NULL,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'photo', 'video', 'poll')),
  video_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_id uuid NOT NULL,
  post_id uuid REFERENCES posts NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid REFERENCES posts NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) NOT NULL,
  following_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) NOT NULL,
  question text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) NOT NULL,
  option_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_option_id uuid REFERENCES poll_options(id) NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_option_id, user_id)
);

-- =====================
-- 2. Add Foreign Key Constraints
-- =====================
ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE likes ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);

-- =====================
-- 3. Enable Row Level Security (RLS)
-- =====================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- =====================
-- 4. Define RLS Policies
-- =====================
-- Categories
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT TO public USING (true);

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Posts
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Likes
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create likes" ON likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Followers
CREATE POLICY "Followers are viewable by everyone" ON followers FOR SELECT TO public USING (true);
CREATE POLICY "Users can follow others" ON followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON followers FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Polls
CREATE POLICY "Polls are viewable by everyone" ON polls FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create polls" ON polls FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid()));

-- Poll Options
CREATE POLICY "Poll options are viewable by everyone" ON poll_options FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create poll options" ON poll_options FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM polls p JOIN posts post ON p.post_id = post.id WHERE poll_options.poll_id = p.id AND post.user_id = auth.uid()));

-- Poll Votes
CREATE POLICY "Poll votes are viewable by everyone" ON poll_votes FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can vote" ON poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change their vote" ON poll_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =====================
-- 5. Insert Default Data
-- =====================
INSERT INTO categories (name, slug) VALUES
  ('Politics', 'politics'),
  ('Entertainment', 'entertainment'),
  ('Sports', 'sports'),
  ('Technology', 'technology'),
  ('Fashion', 'fashion'),
  ('Science', 'science'),
  ('Health', 'health'),
  ('Business', 'business');
